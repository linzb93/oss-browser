import App from './OSSAdapter/Base';
import { HistoryService } from './History';
import { FileItem } from '../types/vo';
import sql from '../helper/sql';

export interface AddOptions {
    prefix: string;
    name: string;
    type: 'directory' | 'file';
}

export class OSSService {
    private apps: App[] = [];
    private historyService = new HistoryService();
    private app: App;
    /**
     * 添加OSS App
     * @param app OSS App适配器
     */
    add(AppCtor: new () => App) {
        this.app = new AppCtor();
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
        return await this.app.getFileList(prefix);
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
}
