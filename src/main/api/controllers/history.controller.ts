import { ipcMain } from 'electron';
import * as historyService from '@/main/modules/history/history.service';
import formatResponse from '@/main/shared/utils/formatResponse';
import { IPage } from '../../types/vo';

export const registerHistoryController = () => {
    ipcMain.handle('history:get-list', (event, dataStr: string) => getList(dataStr));
    ipcMain.handle('history:remove', (event, dataStr: string) => remove(dataStr));
};

const getList = (dataStr: string) => {
    const data = JSON.parse(dataStr) as IPage;
    return formatResponse(() => historyService.get(data));
};
const remove = (dataStr: string) => {
    const ids = JSON.parse(dataStr) as string[];
    return formatResponse(() => historyService.remove(ids));
};
