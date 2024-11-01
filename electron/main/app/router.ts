import { ipcMain, BrowserWindow } from 'electron';
import { BrowserService } from './service/Browser';
import { AccountService } from './service/Account';
import response from './helper/response';
import { Database } from './types/api';
export default (win: BrowserWindow) => {
    const browserService = new BrowserService();
    browserService.setWindow(win);
    const accountService = new AccountService();

    // 登录
    ipcMain.handle('login-get', () => {
        return response(async () => await accountService.get());
    });
    ipcMain.handle('login-save', async (_, dataStr) => {
        const data = JSON.parse(dataStr) as Database['account'];
        return response(async () => await accountService.save(data));
    });
    // OSS操作
    // 设置
    // 收藏
    // 历史
    // 模板
};
