import { ipcMain } from 'electron';
import * as collectService from '@/main/modules/collect/collect.service';
import formatResponse from '@/main/shared/utils/formatResponse';
import { Database } from '../../types/api';

export const registerCollectController = () => {
    ipcMain.handle('collect:get-list', () => getList());
    ipcMain.handle('collect:add', (event, dataStr: string) => add(dataStr));
    ipcMain.handle('collect:set', (event, dataStr: string) => set(dataStr));
};

const getList = () => {
    return formatResponse(() => collectService.get());
};
const add = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        path: string;
    };
    return formatResponse(() => collectService.add(data.path));
};
const set = (dataStr: string) => {
    const data = JSON.parse(dataStr) as Database['collect'];
    return formatResponse(() => collectService.set(data));
};
