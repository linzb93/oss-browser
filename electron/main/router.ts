import { ipcMain } from 'electron';
import ossController from './modules/oss/oss.controller';
import AliOSS from './modules/oss/adapter/Ali/Impl';
import accountController from './modules/account/account.controller';
import settingController from './modules/setting/setting.controller';
import historyController from './modules/history/history.controller';
import templateController from './modules/template/template.controller';
import collectController from './modules/collect/collect.controller';
import utilController from './modules/util/util.controller';
import response from './helper/response';

export default () => {
    ossController.add(AliOSS);
    // 登录
    ipcMain.handle('login-get', () => {
        return response(async () => await accountController.get());
    });
    ipcMain.handle('login-save', async (_, dataStr) => {
        return response(async () => await accountController.save(dataStr));
    });
    // OSS操作
    ipcMain.handle('oss-get-list', (_, dataStr) => {
        return response(async () => await ossController.getFileList(dataStr));
    });
    ipcMain.handle('oss-delete', (_, dataStr) => {
        return response(async () => await ossController.deleteFile(dataStr));
    });
    ipcMain.handle('oss-add-directory', (_, dataStr) => {
        return response(async () => await ossController.addDirectory(dataStr));
    });
    ipcMain.on('oss-upload', (e, data) => {
        ossController.upload(e, data);
    });
    ipcMain.handle('get-buckets', (_, dataStr) => {
        return response(async () => await ossController.getBuckets(dataStr));
    });
    // 设置
    ipcMain.handle('get-setting', () => {
        return response(async () => await settingController.get());
    });
    ipcMain.handle('save-setting', (_, dataStr) => {
        return response(async () => await settingController.set(dataStr));
    });
    ipcMain.handle('set-home', (_, dataStr: string) => {
        return response(async () => await settingController.setHome(dataStr));
    });
    // 收藏
    ipcMain.handle('get-collect', () => {
        return response(async () => await collectController.get());
    });
    ipcMain.handle('add-collect', (_, dataStr: string) => {
        return response(async () => await collectController.add(dataStr));
    });
    ipcMain.handle('set-collect', (_, dataStr) => {
        return response(async () => await collectController.set(dataStr));
    });
    // 历史
    ipcMain.handle('get-history', (_, dataStr) => {
        return response(async () => await historyController.get(dataStr));
    });
    // 模板
    ipcMain.handle('get-template', (_, dataStr) => {
        return response(async () => await templateController.getDetail(dataStr));
    });
    ipcMain.handle('get-template-list', () => {
        return response(async () => await templateController.getList());
    });
    ipcMain.handle('add-template', (_, dataStr) => {
        return response(async () => await templateController.add(dataStr));
    });
    ipcMain.handle('edit-template', (_, dataStr) => {
        return response(async () => await templateController.edit(dataStr));
    });
    ipcMain.handle('remove-template', (_, dataStr) => {
        return response(async () => await templateController.remove(dataStr));
    });
    ipcMain.handle('copy-template', (_, dataStr) => {
        return response(async () => await templateController.copy(dataStr));
    });
    // 通用
    ipcMain.handle('copy', (_, dataStr: string) => {
        return response(() => utilController.copy(dataStr));
    });
    ipcMain.handle('download', (_, dataStr) => {
        return response(async () => await utilController.download(dataStr));
    });
    ipcMain.handle('open', (_, dataStr) => {
        return response(async () => await utilController.open(dataStr));
    });
};
