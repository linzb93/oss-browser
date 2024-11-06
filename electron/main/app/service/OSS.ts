import { join } from 'node:path';
import { interval, Subject, takeUntil } from 'rxjs';
import { IpcMainEvent, BrowserWindow } from 'electron';
import App from './OSSAdapter/Base';
import { HistoryService } from './History';
import { FileItem } from '../types/vo';
import { BrowserService } from './Browser';
import sql from '../helper/sql';
import { __dirname } from '../helper/constant';
import { cloneDeep } from 'lodash-es';

export interface AddOptions {
    prefix: string;
    name: string;
    type: 'directory' | 'file';
}

export class OSSService {
    private apps: App[] = [];
    private historyService = new HistoryService();
    private app: App;
    private win: BrowserWindow;
    constructor() {
        this.win = BrowserService.win;
    }
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
     * 获取匹配的App和OSS Config
     */
    private async getMatches(): Promise<{ app: App; config: any }> {
        const account = await sql((db) => db.account);
        const { platform } = account;
        const matchApp = this.apps.find((app) => app.platformId === platform);
        return {
            app: matchApp,
            config: account,
        };
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
        const list = name.split(',');
        const task$ = new Subject();
        let statusList = list.map((item) => {
            return {
                name: item,
                finished: false,
            };
        });
        let queue = [];
        this.app.addUploadListener((path, progress) => {
            queue.push({
                path,
                progress,
            });
            // 更新statusList
            statusList = statusList.map((item) => {
                if (item.name === path) {
                    return {
                        ...item,
                        finished: progress === 100,
                    };
                }
                return item;
            });
            if (statusList.every((item) => item.finished)) {
                task$.complete();
            }
        });
        list.forEach((item) => {
            this.app.upload(prefix, item);
        });

        const timer$ = interval(2000).pipe(takeUntil(task$));
        timer$.subscribe({
            next() {
                e.sender.send(`oss-add-path-receiver`, {
                    type: 'uploading',
                    data: cloneDeep(queue),
                });
                queue.length = 0;
            },
            complete() {
                e.sender.send(`oss-add-path-receiver`, {
                    type: 'upload-finished',
                });
            },
        });
    }
}
