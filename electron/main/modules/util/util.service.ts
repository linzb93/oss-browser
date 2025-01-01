import http from 'node:http';
import https from 'node:https';
import { join, basename } from 'node:path';
import { createWriteStream } from 'node:fs';
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
export async function download(paths: string) {
    const pathList = castArray(paths.split(','));
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });
    if (result.canceled) {
        return {};
    }
    await pMap(pathList, (url: string) => downloadOne(url, result.filePaths[0]), { concurrency: 4 });
}
/**
 * 下载单个文件
 * 不使用`win.webContents.downloadURL 方法是因为存在批量下载，不可能每个文件都选择一次下载目录。
 * @param path - 文件地址
 */
function downloadOne(url: string, savedPath: string) {
    return new Promise((resolve) => {
        const callback = (resp: http.IncomingMessage) => {
            if (resp.statusCode === 200) {
                resp.pipe(createWriteStream(join(savedPath, basename(url)))).on('finish', resolve);
            }
        };
        if (url.startsWith('https://')) {
            https.get(url, callback);
        } else {
            http.get(url, callback);
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
