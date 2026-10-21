import http from 'node:http';
import https from 'node:https';
import { dirname, isAbsolute, join, parse, resolve as resolvePath, sep } from 'node:path';
import { createWriteStream } from 'node:fs';
import fsp from 'fs-extra';
import { clipboard, dialog, shell } from 'electron';
import pMap from 'p-map';
import { castArray } from 'es-toolkit/compat';
import { interval, Subject, takeUntil } from 'rxjs';
import { getWindow, postRenderer } from '@/main/modules/window/window.service';
import { summarizeDownload, type DownloadTarget } from './download';
import type { DownloadProgressItem, DownloadProgressPayload } from '@/shared/types/oss';

/**
 * 工具函数管理
 */
/** 同时下载的文件数 */
const DOWNLOAD_CONCURRENCY = 4;
/** 下载进度推送间隔（毫秒） */
const DOWNLOAD_TICK = 1000;
/** socket 空闲超时（毫秒）：超过该时间没有任何数据即判定失败 */
const SOCKET_IDLE_TIMEOUT = 30_000;

/**
 * 复制文本
 * @param content 复制的内容
 */
export function copy(content: string) {
    clipboard.writeText(content);
}

/**
 * 把下载进度推送给渲染层
 * @param type 消息类型
 * @param items 全量进度明细
 * @param savedPath 本地保存目录
 */
const emitDownload = (
    type: DownloadProgressPayload['type'],
    items: DownloadProgressItem[],
    savedPath: string,
) => {
    const win = getWindow();
    if (!win || win.isDestroyed()) {
        return;
    }
    postRenderer('download-progress', {
        type,
        savedPath,
        ...summarizeDownload(items),
    });
};

/**
 * 批量下载文件（单文件、目录、批量下载共用）
 * @param targets 下载目标，`path` 为保留目录结构的本地相对路径
 */
export async function download(targets: DownloadTarget[]) {
    // 空目录：不弹出保存目录选择框，直接通知渲染层结束
    if (!targets.length) {
        emitDownload('download-finished', [], '');
        return;
    }
    const items: DownloadProgressItem[] = targets.map((target) => ({
        key: target.key,
        path: target.path,
        size: 0,
        loaded: 0,
        progress: 0,
        finished: false,
    }));
    emitDownload('downloading', items, '');

    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths.length) {
        emitDownload('download-canceled', items, '');
        return;
    }
    const savedPath = result.filePaths[0];
    emitDownload('downloading', items, savedPath);

    // 周期性推送进度，避免每个文件都往渲染层发消息
    const task$ = new Subject<void>();
    interval(DOWNLOAD_TICK)
        .pipe(takeUntil(task$))
        .subscribe(() => {
            emitDownload('downloading', items, savedPath);
        });

    try {
        await pMap(
            targets,
            (target, index) => downloadOne(target, items[index], savedPath),
            { concurrency: DOWNLOAD_CONCURRENCY },
        );
    } finally {
        // 无论成功失败都要停掉定时器，避免进度推送泄漏
        task$.next();
        task$.complete();
    }
    emitDownload('download-finished', items, savedPath);
}

/**
 * 兼容以在线地址（逗号分隔）触发下载的场景。
 * 本地相对路径退化为文件名，不再依赖 domain 字符串替换。
 * @param paths 在线地址，多个用逗号分隔
 */
export async function downloadUrls(paths: string) {
    const list = castArray(paths.split(','))
        .map((item) => item.trim())
        .filter(Boolean);
    await download(
        list.map((url) => {
            const name = toFileName(url);
            return {
                url,
                key: name,
                path: name,
            };
        }),
    );
}

/**
 * 从在线地址里取文件名，地址无法解析时返回原始字符串
 * @param url 在线地址
 */
const toFileName = (url: string) => {
    try {
        return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || url);
    } catch {
        return url;
    }
};

/**
 * 下载单个文件
 * 不使用`win.webContents.downloadURL 方法是因为存在批量下载，不可能每个文件都选择一次下载目录。
 * 无论成功还是失败都会 resolve，避免单个文件失败导致整批下载一直挂起。
 * @param target 下载目标
 * @param item 该文件的进度对象，直接原地更新
 * @param savedPath 本地保存目录
 */
function downloadOne(target: DownloadTarget, item: DownloadProgressItem, savedPath: string): Promise<void> {
    return new Promise<void>((resolve) => {
        const localPath = join(savedPath, target.path);
        // 防止对象 key 里的相对路径跳出用户选择的目录
        const root = resolvePath(savedPath);
        const resolved = resolvePath(localPath);
        const safe = resolved === root || resolved.startsWith(root.endsWith(sep) ? root : root + sep);

        let settled = false;
        // 是否已经开始写入磁盘（失败时用于清理半截文件）
        let writing = false;
        const settle = (failed: boolean, message?: string) => {
            if (settled) {
                return;
            }
            settled = true;
            item.finished = true;
            if (failed) {
                item.failed = true;
                console.log(`下载失败：${target.key}`, message);
                if (writing) {
                    fsp.remove(localPath).catch(() => {});
                }
            } else {
                item.progress = 100;
            }
            resolve();
        };

        if (!safe) {
            settle(true, '本地路径越界');
            return;
        }

        const onResponse = (resp: http.IncomingMessage) => {
            if (resp.statusCode !== 200) {
                resp.resume();
                settle(true, `HTTP ${resp.statusCode}`);
                return;
            }
            const size = Number(resp.headers['content-length']) || 0;
            item.size = size;
            writing = true;
            const stream = createWriteStream(localPath);
            resp.on('data', (chunk: Buffer) => {
                item.loaded += chunk.length;
                if (size) {
                    // 留 1% 给写入完成
                    item.progress = Math.min(Math.round((item.loaded / size) * 100), 99);
                }
            });
            resp.on('error', (error: Error) => {
                stream.destroy();
                settle(true, error.message);
            });
            stream.on('error', (error: Error) => {
                resp.destroy();
                settle(true, error.message);
            });
            stream.on('finish', () => settle(false));
            resp.pipe(stream);
        };

        (async () => {
            try {
                await fsp.mkdir(dirname(localPath), { recursive: true });
            } catch (error) {
                settle(true, (error as Error).message);
                return;
            }
            let url: URL;
            try {
                // 用 WHATWG URL 解析，顺带处理文件名里的空格、中文等字符
                url = new URL(target.url);
            } catch {
                settle(true, '在线地址不合法');
                return;
            }
            const request = (url.protocol === 'https:' ? https : http).get(url, onResponse);
            request.setTimeout(SOCKET_IDLE_TIMEOUT, () => {
                request.destroy(new Error('下载超时'));
            });
            request.on('error', (error: Error) => {
                settle(true, error.message);
            });
        })().catch((error: Error) => {
            settle(true, error.message);
        });
    });
}

/**
 * 删除本地文件或目录，用于「上传完成后删除源文件」。
 * 目录会连同其中的文件一起被删除，调用方需保证传入的是用户确实上传过的源路径。
 * @param paths 本地绝对路径列表
 */
export async function removeLocalFiles(paths: string[]) {
    // 只处理绝对路径，并排除磁盘根目录，避免误删
    const list = [...new Set((paths || []).filter((path) => isAbsolute(path) && parse(path).root !== path))];
    const failed: string[] = [];
    await pMap(
        list,
        async (path) => {
            try {
                await fsp.remove(path);
            } catch (error) {
                failed.push(path);
            }
        },
        { concurrency: 4 },
    );
    if (failed.length) {
        throw new Error(`源文件删除失败：${failed.join('、')}`);
    }
}

/**
 * 打开网页或本地目录
 */
export async function open(type: 'path' | 'web', url: string) {
    const pathList = castArray(url.split(','));
    await pMap(
        pathList,
        (path) => {
            if (type === 'path') {
                shell.openPath(path);
                return;
            }
            if (type === 'web') {
                shell.openExternal(path);
            }
        },
        { concurrency: 4 },
    );
}
/**
 * 选择文件夹路径
 */
export async function getSelectedPath(multiSelections: boolean) {
    const result = await dialog.showOpenDialog({
        properties: multiSelections ? ['openDirectory', 'multiSelections'] : ['openDirectory'],
    });
    if (result.canceled) {
        return {
            path: '',
        };
    }
    if (multiSelections) {
        return {
            paths: result.filePaths,
        };
    }
    return {
        path: result.filePaths[0],
    };
}
