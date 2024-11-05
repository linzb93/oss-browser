import { ipcMain, BrowserWindow } from 'electron';
import { BrowserService } from './service/Browser';
import { OSSService, AddOptions as OSSAddOptions } from './service/OSS';
import AliOSS from './service/OSSAdapter/Ali';
import { AccountService } from './service/Account';
import { SettingService } from './service/Setting';
import { HistoryService } from './service/History';
import { TemplateService } from './service/Template';
import { CollectService } from './service/Collect';
import { UtilService } from './service/Util';
import response from './helper/response';
import { Database } from './types/api';
import { IPage } from './types/vo';

export default (win: BrowserWindow) => {
    const browserService = new BrowserService();
    browserService.setWindow(win);
    const ossService = new OSSService();
    ossService.add(AliOSS);
    const accountService = new AccountService();
    const settingService = new SettingService();
    const templateService = new TemplateService();
    const historyService = new HistoryService();
    const collectService = new CollectService();
    const utilService = new UtilService();
    // 登录
    ipcMain.handle('login-get', () => {
        return response(async () => await accountService.get());
    });
    ipcMain.handle('login-save', async (_, dataStr) => {
        const data = JSON.parse(dataStr) as Database['account'];
        return response(async () => await accountService.save(data));
    });
    // OSS操作
    ipcMain.handle('oss-get-list', (_, dataStr) => {
        const data = JSON.parse(dataStr) as {
            prefix: string;
            useToken: boolean;
        };
        return response(async () => await ossService.getFileList(data));
    });
    ipcMain.handle('oss-delete', (_, dataStr) => {
        const data = JSON.parse(dataStr) as {
            path: string;
        };
        return response(async () => await ossService.deleteFile(data.path));
    });
    ipcMain.handle('oss-add-path', (_, dataStr) => {
        const data = JSON.parse(dataStr) as OSSAddOptions;
        return response(async () => await ossService.addPath(data));
    });
    ipcMain.handle('oss-upload', (_, dataStr) => {
        const data = JSON.parse(dataStr) as OSSAddOptions;
        return response(async () => await ossService.addPath(data));
    });
    // 设置
    ipcMain.handle('get-setting', () => {
        return response(async () => await settingService.get());
    });
    ipcMain.handle('save-setting', (_, dataStr) => {
        const data = JSON.parse(dataStr) as Database['setting'];
        return response(async () => await settingService.set(data));
    });
    ipcMain.handle('set-home', (_, dataStr: string) => {
        const data = JSON.parse(dataStr) as {
            path: string;
        };
        return response(async () => await settingService.setHome(data.path));
    });
    // 收藏
    ipcMain.handle('get-collect', () => {
        return response(async () => await collectService.get());
    });
    ipcMain.handle('add-collect', (_, dataStr: string) => {
        const data = JSON.parse(dataStr) as {
            path: string;
        };
        return response(async () => await collectService.add(data.path));
    });
    ipcMain.handle('set-collect', (_, dataStr) => {
        const data = JSON.parse(dataStr) as Database['collect'];
        return response(async () => await collectService.set(data));
    });
    // 历史
    ipcMain.handle('get-history', (_, dataStr) => {
        const data = JSON.parse(dataStr) as IPage;
        return response(async () => await historyService.get(data));
    });
    // 模板
    ipcMain.handle('get-template', (_, dataStr) => {
        const data = JSON.parse(dataStr) as {
            id: number;
        };
        return response(async () => await templateService.getDetail(data.id));
    });
    ipcMain.handle('get-template-list', () => {
        return response(async () => await templateService.getList());
    });
    ipcMain.handle('add-template', (_, dataStr) => {
        const data = JSON.parse(dataStr) as Database['templates'][number];
        return response(async () => await templateService.add(data));
    });
    ipcMain.handle('edit-template', (_, dataStr) => {
        const data = JSON.parse(dataStr) as Database['templates'][number];
        return response(async () => await templateService.edit(data));
    });
    ipcMain.handle('remove-template', (_, dataStr) => {
        const data = JSON.parse(dataStr) as Database['templates'][number];
        return response(async () => await templateService.remove(data));
    });
    ipcMain.handle('copy-template', (_, dataStr) => {
        const data = JSON.parse(dataStr) as {
            width: number;
            height: number;
            url: string;
        };
        return response(async () => await templateService.copy(data));
    });
    // 通用
    ipcMain.handle('copy', (_, dataStr: string) => {
        const data = JSON.parse(dataStr) as {
            content: string;
        };
        return response(() => utilService.copy(data.content));
    });
    ipcMain.handle('download', (_, dataStr) => {
        const data = JSON.parse(dataStr) as {
            url: string;
        };
        return response(async () => await utilService.download(data.url));
    });
    ipcMain.handle('open', (_, dataStr) => {
        const data = JSON.parse(dataStr) as {
            type: 'path' | 'web';
            url: string;
        };
        return response(async () => await utilService.open(data.type, data.url));
    });
};
