import { join, dirname, basename, extname } from 'node:path';
import { Readable } from 'node:stream';
import fs from 'fs-extra';
import { interval, Subject, takeUntil, map } from 'rxjs';
import { cloneDeep } from 'es-toolkit';
import { AliOssClient, OssConfig } from '@/main/infra/ali-oss';
import slash from 'slash';
import App from './adapter/Base';
import { type FileItem } from '../../types/vo';
import { __dirname } from '../../shared/constants/path';
import { AddOptions, AppConstructorOptions } from './oss.dto';
import { ossEvents } from './oss.repository';
import { Database } from '../../types/api';
import { accountEvents } from '../account/events';
import { getWindow } from '../window/window.service';

/**
 * fetch 响应体的类型（跟随当前运行环境里的 fetch 实现）
 */
type FetchBody = NonNullable<Awaited<ReturnType<typeof fetch>>['body']>;

let currentApp: App;
/**
 * 复制的文件信息（剪贴板）
 */
let copiedFile: { name: string; path: string } | null = null;
/**
 * 当前目录（渲染层导航时上报）
 */
let currentPath: string = '';

/**
 * 设置复制的文件
 * @param file 文件信息，含文件名与对象 key
 */
export function setCopiedFile(file: { name: string; path: string } | null) {
    copiedFile = file;
}
/**
 * 获取复制的文件
 */
export function getCopiedFile() {
    return copiedFile;
}
/**
 * 设置当前目录
 * @param path 目录路径，以"/"收尾
 */
export function setCurrentPath(path: string) {
    currentPath = path;
}
/**
 * 获取当前目录
 */
export function getCurrentPath() {
    return currentPath;
}

/**
 * 添加OSS App
 * @param app OSS App适配器
 */
export function add(AppCtor: new (options: AppConstructorOptions) => App) {    
    currentApp = new AppCtor({
        sizeBoundary: '20MB',
    });
    accountEvents.on('set-current', () => {
        currentApp.init();
    });
}
/**
 * 获取文件列表
 * @param prefix 目录前缀
 */
export async function getFileList(data: {
    prefix: string;
    pageSize: number;
    direction: 'reset' | 'next' | 'prev';
}): Promise<{
    list: FileItem[];
    hasNext: boolean;
    hasPrev: boolean;
    page: number;
}> {
    return await currentApp.getFileList(data);
}
export async function addDirectory(params: AddOptions): Promise<void> {
    await currentApp.addDirectory(params);
}
/**
 * 复制文件到目标路径
 * @param sourcePath 源对象 key
 * @param targetPath 目标对象 key
 */
export async function copyFile(sourcePath: string, targetPath: string): Promise<void> {
    await currentApp.copyFile(sourcePath, targetPath);
}
/**
 * 判断对象是否存在
 * @param name 对象 key
 */
export async function objectExists(name: string): Promise<boolean> {
    return await currentApp.head(name);
}
export async function deleteFile(paths: string): Promise<any> {
    const unsuccessfulList = await currentApp.deleteFile(paths);
    ossEvents.emit('remove', paths);
    return unsuccessfulList;
}
/**
 * 上传文件，支持批量目录上传
 */
export async function upload(data: AddOptions) {
    const { names, prefix } = data;
    const list = names
        .split(',')
        .map((name) => {
            if (!extname(name)) {
                // 上传的是目录
                const fileDirname = slash(dirname(name));
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
        takeUntil(task$),
    );
    const win = getWindow();
    timer$.subscribe({
        next() {
            win.webContents.send('main-post', {
                method: 'upload-progress',
                data: {
                    type: 'uploading',
                    data: cloneDeep(statusList),
                },
            });
        },
        complete() {
            ossEvents.emit('add', {
                prefix,
                names,
                type: 'file',
            });
            win.webContents.send('main-post', {
                method: 'upload-progress',
                data: {
                    type: 'upload-finished',
                    data: cloneDeep(statusList),
                },
            });
        },
    });
}

/**
 * 复制在线文件：把在线地址的文件以流的方式上传到指定目录
 * @param data 目标目录、在线地址，以及重命名后的文件名（为空则使用原名）
 */
export async function copyOnlineFile(data: { prefix: string; url: string; name?: string }) {
    const { prefix } = data;
    const { url, name: originName } = parseOnlineUrl(data.url);
    const fileName = data.name?.trim() || originName;
    if (!fileName) {
        throw new Error('无法从在线地址中解析出文件名，请重命名后再上传');
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`获取在线文件失败（HTTP ${response.status}）`);
    }
    if (!response.body) {
        throw new Error('在线文件内容为空');
    }
    // 长度未知时交给 ali-oss 用 chunked 编码
    const size = Number(response.headers.get('content-length')) || 0;
    // 边下载边上传，避免把整个文件读进内存
    const stream = bodyToStream(response.body);
    await currentApp.putStream(prefix, {
        ossPath: fileName,
        stream,
        size,
    });
    ossEvents.emit('add', {
        prefix,
        names: fileName,
        type: 'file',
    });
}

/**
 * 把在线响应的 body 转成 Node 可读流。
 * 这里通过读取器手动迭代，而不是直接用 Readable.fromWeb，以免不同 web 流实现之间的品牌校验问题。
 * @param body 在线响应的 body
 * @returns Node 可读流
 */
function bodyToStream(body: FetchBody) {
    const reader = body.getReader();
    return Readable.from(
        (async function* () {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        return;
                    }
                    yield value;
                }
            } finally {
                reader.releaseLock();
            }
        })(),
    );
}

/**
 * 解析在线文件地址：补全协议头并提取原文件名
 * @param url 用户输入的在线地址
 * @returns 规范化后的地址与文件名（地址末尾没有文件名时为空字符串）
 */
function parseOnlineUrl(url: string) {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    let pathname = '';
    try {
        pathname = new URL(normalized).pathname;
    } catch {
        throw new Error('在线文件地址不合法');
    }
    const segment = pathname.split('/').filter(Boolean).pop() || '';
    try {
        return {
            url: normalized,
            name: decodeURIComponent(segment),
        };
    } catch {
        // 地址里有非法的转义字符时，直接使用原始片段
        return {
            url: normalized,
            name: segment,
        };
    }
}

export const validate = async (data: Database['accounts'][number]) => {
    return getBuckets(data);
};

export const getBuckets = async (ossOptions: OssConfig) => {
    const client = new AliOssClient(ossOptions);
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

    files.forEach((file:any) => {
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

/**
 * 下载文件：支持单文件、目录与批量下载
 * @param paths oss 对象 key，多个用逗号分隔；目录以 / 结尾
 */
export async function download(paths: string) {
    return await currentApp.download(paths);
}
export async function init() {
    return currentApp && (await currentApp.init());
}
