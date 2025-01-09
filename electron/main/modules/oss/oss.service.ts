import { join, basename } from 'node:path';
import { interval, Subject, takeUntil, map } from 'rxjs';
import { type IpcMainEvent } from 'electron';
import { cloneDeep } from 'lodash-es';
import App from './adapter/Base';

import { type FileItem } from '../../types/vo';
import { __dirname } from '../../enums/index.enum';
import { AddOptions } from './oss.dto';
import { ossEvents } from './oss.repository';
import OSS, { OssConfig } from 'ali-oss';
import { Database } from '../../types/api';
import slash from 'slash';
let currentApp: App;
/**
 * 添加OSS App
 * @param app OSS App适配器
 */
export function add(AppCtor: new () => App) {
    currentApp = new AppCtor();
    currentApp.setUploadFileSizeEdge({
        large: '20MB',
        small: '10MB',
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
export async function addPath(params: AddOptions): Promise<void> {
    await currentApp.addPath({
        ...params,
    });
    // ossEvents.emit('add', params);
}
export async function deleteFile(paths: string): Promise<any> {
    const unsuccessfulList = await currentApp.deleteFile(paths);
    ossEvents.emit('remove', paths);
    return unsuccessfulList;
}
export async function upload(e: IpcMainEvent, data: AddOptions) {
    const { names, prefix } = data;
    const list = names.split(',').map((item) => slash(item));
    const task$ = new Subject();
    let statusList = list.map((item) => {
        return {
            path: slash(join(prefix, basename(item))),
            finished: false,
        };
    });
    currentApp.addUploadListener((data) => {
        const { path, progress, size } = data;
        statusList = statusList.map((item) => {
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
                size: 0,
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
                names,
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
