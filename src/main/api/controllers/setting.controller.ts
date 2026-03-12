import { ipcMain } from 'electron';
import * as settingService from '@/main/modules/setting/setting.service';
import formatResponse from '@/main/shared/utils/formatResponse';
import { Database } from '../../types/api';
export const registerSettingController = () => {
    ipcMain.handle('setting:get', () => get());
    ipcMain.handle('setting:set', (event, dataStr: string) => set(dataStr));
    ipcMain.handle('setting:set-home', (event, dataStr: string) => setHome(dataStr));
};

const get = () => {
    return formatResponse(() => settingService.get());
};
const set = (dataStr: string) => {
    const data = JSON.parse(dataStr) as Database['setting'];
    return formatResponse(() => settingService.set(data));
};
const setHome = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        path: string;
    };
    return formatResponse(() => settingService.setHome(data.path));
};
