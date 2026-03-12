import { ipcMain } from 'electron';
import * as accountService from '@/main/modules/account/account.service';
import formatResponse from '@/main/shared/utils/formatResponse';
import { Database } from '../../types/api';
export const registerAccountController = () => {
    ipcMain.handle('account:get-list', () => getList());
    ipcMain.handle('account:get-item', (event, dataStr: string) => getItem(dataStr));
    ipcMain.handle('account:save', (event, dataStr: string) => save(dataStr));
    ipcMain.handle('account:get-default-app-id', () => getDefaultAppId());
    ipcMain.handle('account:set-default-app-id', (event, dataStr: string) => setDefaultAppId(dataStr));
    ipcMain.handle('account:remove', (event, dataStr: string) => remove(dataStr));
};

const getList = () => {
    return formatResponse(() => accountService.getList());
};

const getItem = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        id: number;
    };
    return formatResponse(() => accountService.getItem(data.id));
};
const save = (dataStr: string) => {
    const data = JSON.parse(dataStr) as Database['accounts'][number];
    return formatResponse(() => accountService.save(data));
};
const getDefaultAppId = () => {
    return formatResponse(() => accountService.getDefaultAppId());
};
const setDefaultAppId = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        id: number;
    };
    return formatResponse(() => accountService.setDefaultAppId(data.id));
};
const remove = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        id: number;
    };
    return formatResponse(() => accountService.remove(data.id));
};
