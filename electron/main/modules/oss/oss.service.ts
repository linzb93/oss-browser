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
    ossEvents.emit('add', params);
}
export async function deleteFile(paths: string): Promise<void> {
    await currentApp.deleteFile(paths);
    ossEvents.emit('remove', paths);
}
export async function upload(e: IpcMainEvent, data: AddOptions) {
    const { names, prefix } = data;
    const list = names.split(',').map((item) => item.replace(/\\/g, '/'));
    const task$ = new Subject();
    let statusList = list.map((item) => {
        return {
            name: join(prefix, basename(item)),
            finished: false,
        };
    });
    currentApp.addUploadListener((data) => {
        const { name: path, progress, size } = data;
        // 更新statusList
        statusList = statusList.map((item) => {
            const realName = item.name.replace(/\\/g, '/');
            if (realName === path) {
                return {
                    ...item,
                    name: realName,
                    progress,
                    size,
                    finished: progress === 100,
                };
            }
            return {
                ...item,
                name: realName,
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
