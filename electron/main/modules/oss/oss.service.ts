import { join, dirname, basename, extname } from 'node:path';
import { type IpcMainEvent } from 'electron';
import fs from 'fs-extra';
import { interval, Subject, takeUntil, map } from 'rxjs';
import { cloneDeep } from 'lodash-es';
import OSS, { OssConfig } from 'ali-oss';
import slash from 'slash';
import App from './adapter/Base';
import { type FileItem } from '../../types/vo';
import { __dirname } from '../../enums/index.enum';
import { AddOptions, AppConstructorOptions } from './oss.dto';
import { ossEvents } from './oss.repository';
import { Database } from '../../types/api';

let currentApp: App;
/**
 * 添加OSS App
 * @param app OSS App适配器
 */
export function add(AppCtor: new (options: AppConstructorOptions) => App) {
    currentApp = new AppCtor({
        sizeBoundary: '20MB',
    });
}
/**
 * 获取文件列表
 * @param prefix 目录前缀
 */
export async function getFileList(data: { prefix: string; useToken: boolean }): Promise<{
    list: FileItem[];
}> {
    return await currentApp.getFileList(data);
}
export async function addDirectory(params: AddOptions): Promise<void> {
    await currentApp.addDirectory(params);
}
export async function deleteFile(paths: string): Promise<any> {
    const unsuccessfulList = await currentApp.deleteFile(paths);
    ossEvents.emit('remove', paths);
    return unsuccessfulList;
}
export async function upload(e: IpcMainEvent, data: AddOptions) {
    const { names, prefix } = data;
    const list = names
        .split(',')
        .map((item) => {
            if (!extname(item)) {
                // 是目录
                const fileDirname = slash(dirname(item));
                return readDirectoryRecursively(item).map((originlocalPath) => {
                    const localPath = slash(originlocalPath);
                    return {
                        localPath,
                        ossPath: localPath.replace(`${fileDirname}/`, ''),
                    };
                });
            }
            return {
                localPath: slash(item),
                ossPath: basename(item),
            };
        })
        .flat();
    const task$ = new Subject();
    let statusList = list.map((item) => {
        return {
            path: slash(join(prefix, item.ossPath)),
            size: 0,
            finished: false,
        };
    });
    currentApp.addUploadListener((data) => {
        const { path, progress, size } = data;
        statusList = statusList.map((item) => {
            // 用完整的oss path进行对比
            if (item.path === path) {
                return {
                    ...item,
                    path: item.path,
                    progress,
                    size,
                    finished: progress === 100,
                };
            }
            return {
                ...item,
                size: item.size,
                path: item.path,
            };
        });
        if (statusList.every((item) => item.finished)) {
            task$.next(null);
            task$.complete();
        }
    });
    list.forEach((item) => {
        currentApp.upload(prefix, item);
    });

    const timer$ = interval(2000).pipe(
        map((data) => `已经经过了${data}秒`),
        takeUntil(task$)
    );
    timer$.subscribe({
        next() {
            e.sender.send(`oss-upload-receiver`, {
                type: 'uploading',
                data: cloneDeep(statusList),
            });
        },
        complete() {
            ossEvents.emit('add', {
                prefix,
                names, // TODO：加入上传文件夹后，这个地方得改成目录里面的所有文件拼接的
                type: 'file',
            });
            e.sender.send(`oss-upload-receiver`, {
                type: 'upload-finished',
                data: cloneDeep(statusList),
            });
        },
    });
}

export const validate = async (data: Database['account']) => {
    return getBuckets(data);
};

export const getBuckets = async (ossOptions: OssConfig) => {
    const client = new OSS(ossOptions);
    try {
        const ret = await client.listBuckets();
        return ret.buckets.map((item) => ({
            name: item.name,
        }));
    } catch (error) {
        throw new Error('error');
    }
};

/**
 * 读取一个文件夹里的所有目录
 */
function readDirectoryRecursively(directory: string): string[] {
    let fileList: string[] = [];

    const files = fs.readdirSync(directory);

    files.forEach((file) => {
        const filePath = join(directory, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // 如果是目录，递归调用该函数
            fileList = fileList.concat(readDirectoryRecursively(filePath));
        } else {
            // 如果是文件，将文件名添加到列表中
            fileList.push(filePath);
        }
    });

    return fileList;
}
