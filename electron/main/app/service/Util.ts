import http from 'node:http';
import https from 'node:https';
import { createWriteStream } from 'node:fs';
import { clipboard, dialog, shell } from 'electron';
import pMap from 'p-map';
import { castArray } from 'lodash-es';

export class UtilService {
    /**
     * 复制文本
     * @param content 复制的内容
     */
    copy(content: string) {
        clipboard.writeText(content);
    }
    /**
     * 批量下载文件
     */
    async download(paths: string) {
        const pathList = castArray(paths.split(','));
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        if (result.canceled) {
            return {};
        }
        await pMap(pathList, (url: string) => this.downloadOne(url), { concurrency: 4 });
    }
    /**
     * 下载单个文件
     * @param path - 文件地址
     * @returns
     */
    private async downloadOne(path: string) {
        return await new Promise((resolve) => {
            const callback = (resp: http.IncomingMessage) => {
                if (resp.statusCode === 200) {
                    resp.pipe(createWriteStream(path)).on('finish', resolve);
                }
            };
            if (path.startsWith('https://')) {
                https.get(path, callback);
            } else {
                http.get(path, callback);
            }
        });
    }
    /**
     * 打开网页或本地目录
     */
    async open(type: 'path' | 'web', url: string) {
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
    async getSelectedPath(multiSelections: boolean) {
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
}
