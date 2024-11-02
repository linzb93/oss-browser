import { join, basename } from 'node:path';
import App from './OSSAdapter/Base';
import { HistoryService } from './History';
import { FileItem } from '../types/vo';
import sql from '../helper/sql';
import { castArray } from 'lodash-es';

export interface AddOptions {
    prefix: string;
    name: string | string[];
    type: 'directory' | 'file';
}

export class OSSService {
    private apps: App[] = [];
    private historyService = new HistoryService();
    /**
     * 添加OSS App
     * @param app OSS App适配器
     */
    add(AppCtor: new () => App) {
        this.apps.push(new AppCtor());
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
    async getFileList(prefix: string): Promise<{
        list: FileItem[];
    }> {
        const { app, config } = await this.getMatches();
        return await app.getFileList(prefix, config);
    }
    async addPath(params: AddOptions): Promise<void> {
        const { app, config } = await this.getMatches();
        await app.addPath({
            ...params,
            config,
        });
        const result = Array.isArray(params.name)
            ? params.name.map((item) => join(params.prefix, basename(item)).replace(/\\/g, '/'))
            : [join(params.prefix, basename(params.name)).replace(/\\/g, '/')];
        await this.historyService.add(result.join(','));
    }
    async deleteFile(path: string | string[]): Promise<void> {
        const { app, config } = await this.getMatches();
        await app.deleteFile(path, config);
        const realPath = castArray(path);
        await this.historyService.remove(realPath.join(','));
    }
}
