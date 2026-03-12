import { ipcMain } from 'electron';
import * as templateService from '@/main/modules/template/template.service';
import formatResponse from '@/main/shared/utils/formatResponse';
import { Database } from '../../types/api';
export const registerTemplateController = () => {
    ipcMain.handle('template:get-detail', (event, dataStr: string) => getDetail(dataStr));
    ipcMain.handle('template:get-list', () => getList());
    ipcMain.handle('template:add', (event, dataStr: string) => add(dataStr));
    ipcMain.handle('template:edit', (event, dataStr: string) => edit(dataStr));
    ipcMain.handle('template:remove', (event, dataStr: string) => remove(dataStr));
    ipcMain.handle('template:copy', (event, dataStr: string) => copy(dataStr));
};

const getDetail = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        id: number;
    };
    return formatResponse(() => templateService.getDetail(data.id));
};
const getList = () => {
    return formatResponse(() => templateService.getList());
};
const add = (dataStr: string) => {
    const data = JSON.parse(dataStr) as Database['templates'][number];
    return formatResponse(() => templateService.add(data));
};
const edit = (dataStr: string) => {
    const data = JSON.parse(dataStr) as Database['templates'][number];
    return formatResponse(() => templateService.edit(data));
};
const remove = (dataStr: string) => {
    const data = JSON.parse(dataStr) as Database['templates'][number];
    return templateService.remove(data);
};
const copy = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        width: number;
        height: number;
        url: string;
    };
    return formatResponse(() => templateService.copy(data));
};
