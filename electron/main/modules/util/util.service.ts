import http from 'node:http';
import https from 'node:https';
import { dirname, join } from 'node:path';
import sql from '../../helper/sql';
import { createWriteStream } from 'node:fs';
import fsp from 'fs-extra';
import { clipboard, dialog, shell } from 'electron';
import pMap from 'p-map';
import { castArray } from 'lodash-es';

/**
 * 工具函数管理
 */
/**
 * 复制文本
 * @param content 复制的内容
 */
export function copy(content: string) {
    clipboard.writeText(content);
}
/**
 * 批量下载文件
 */
export async function download(paths: string, dir: string) {
    const pathList = castArray(paths.split(','));
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });
    if (result.canceled) {
        return {};
    }
    const account = await sql((db) => db.account);
    await pMap(
        pathList,
        (url: string) =>
            downloadOne({
                url,
                savedPath: result.filePaths[0],
                dir,
                domain: account.domain,
            }),
        { concurrency: 4 }
    );
}
/**
 * 下载单个文件
 * 不使用`win.webContents.downloadURL 方法是因为存在批量下载，不可能每个文件都选择一次下载目录。
 * @param path - 文件地址
 */
function downloadOne(data: { url: string; savedPath: string; dir: string; domain: string }) {
    return new Promise((resolve) => {
        const callback = async (resp: http.IncomingMessage) => {
            if (resp.statusCode === 200) {
                const localPath = join(data.savedPath, data.url.replace(`${data.domain}/${data.dir}/`, ''));
                try {
                    await fsp.access(dirname(localPath));
                } catch (error) {
                    await fsp.mkdir(dirname(localPath));
                }
                resp.pipe(createWriteStream(localPath)).on('finish', resolve);
            }
        };
        if (data.url.startsWith('https://')) {
            https.get(data.url, callback);
        } else {
            http.get(data.url, callback);
        }
    });
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
        { concurrency: 4 }
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
