import { join, basename } from 'node:path';
import { interval, Subject, takeUntil, map } from 'rxjs';
import { type IpcMainEvent } from 'electron';
import { cloneDeep } from 'lodash-es';
import App from './OSSAdapter/Base';
import { HistoryService } from './History';
import { type FileItem } from '../types/vo';
import { __dirname } from '../helper/constant';

export interface AddOptions {
    /**
     * 上传目录
     */
    prefix: string;
    /**
     * 上传文件在本机的地址,Windows系统下记得转换分隔符
     */
    name: string;
    type: 'directory' | 'file';
}

export class OSSService {
    private historyService = new HistoryService();
    private app: App;
    /**
     * 添加OSS App
     * @param app OSS App适配器
     */
    add(AppCtor: new () => App) {
        this.app = new AppCtor();
        this.app.setUploadFileSizeEdge({
            large: '20MB',
            small: '10MB',
        });
    }
    /**
     * 获取文件列表
     * @param prefix 目录前缀
     */
    async getFileList(data: { prefix: string; useToken: boolean }): Promise<{
        list: FileItem[];
    }> {
        return await this.app.getFileList(data);
    }
    async addPath(params: AddOptions): Promise<void> {
        await this.app.addPath({
            ...params,
        });
        await this.historyService.add(params);
    }
    async deleteFile(path: string): Promise<void> {
        await this.app.deleteFile(path);
        await this.historyService.remove(path);
    }
    async upload(e: IpcMainEvent, data: AddOptions) {
        const { name, prefix } = data;
        const list = name.split(',').map((item) => item.replace(/\\/g, '/'));
        const task$ = new Subject();
        let statusList = list.map((item) => {
            return {
                name: join(prefix, basename(item)),
                finished: false,
            };
        });
        this.app.addUploadListener((data) => {
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
            this.app.upload(prefix, item);
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
}
