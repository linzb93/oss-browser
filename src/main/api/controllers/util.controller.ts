import { ipcMain } from 'electron';
import * as utilService from '@/main/modules/util/util.service';
import formatResponse from '@/main/shared/utils/formatResponse';

export const registerUtilController = () => {
    ipcMain.handle('util:copy', (event, dataStr: string) => copy(dataStr));
    ipcMain.handle('util:download', (event, dataStr: string) => download(dataStr));
    ipcMain.handle('util:open', (event, dataStr: string) => open(dataStr));
};

const copy = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        content: string;
    };
    return formatResponse(() => utilService.copy(data.content));
};
const download = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        url: string;
    };
    return formatResponse(() => utilService.download(data.url, ''));
};
const open = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        type: 'path' | 'web';
        url: string;
    };
    return formatResponse(() => utilService.open(data.type, data.url));
};
