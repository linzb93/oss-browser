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
import { v4 as uuidv4 } from 'uuid';
import * as workflowService from '../workflow/workflow.service';
import * as settingService from '../setting/setting.service';

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
/**
 * 上传文件，支持批量目录上传
 */
export async function upload(e: IpcMainEvent, data: AddOptions) {
    const { names, prefix } = data;
    // 读取workflowId
    const { copyWorkflowId } = await settingService.get();
    const workflowItem = await workflowService.getById(copyWorkflowId);
    let list = names
        .split(',')
        .map((name) => {
            if (!extname(name)) {
                // 上传的是目录
                const fileDirname = slash(dirname(name));
                console.log(fileDirname);
                return readDirectoryRecursively(name).map((originLocalPath) => {
                    const localPath = slash(originLocalPath);
                    return {
                        localPath,
                        ossPath: localPath.replace(`${fileDirname}/`, ''),
                    };
                });
            }
            return {
                localPath: slash(name),
                ossPath: basename(name),
            };
        })
        .flat();
    list = list.map((item, index) => {
        let { ossPath } = item;
        if (workflowItem.nameType === 'index') {
            // 将目录地址里面的文件basename换成index值，目录前缀地址不变
            const pathDirname = dirname(ossPath);
            if (pathDirname === '.') {
                ossPath = `${index + 1}${extname(ossPath)}`;
            } else {
                ossPath = `${pathDirname}/${index + 1}${extname(ossPath)}`;
            }
        } else if (workflowItem.nameType === 'uid') {
            // 将目录地址里面的文件basename换成index值，目录前缀地址不变
            const pathDirname = dirname(ossPath);
            if (pathDirname === '.') {
                ossPath = `${uuidv4()}${extname(ossPath)}`;
            } else {
                ossPath = `${pathDirname}/${uuidv4()}${extname(ossPath)}`;
            }
        }
        return {
            ...item,
            ossPath,
        };
    });
    console.log(list);
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

export const validate = async (data: Database['accounts'][number]) => {
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

export async function download(paths: string) {
    return await currentApp.download(paths);
}
export async function init() {
    return await currentApp.init();
}
