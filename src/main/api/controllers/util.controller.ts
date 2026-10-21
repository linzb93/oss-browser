import { ipcMain } from 'electron';
import * as utilService from '@/main/modules/util/util.service';
import formatResponse from '@/main/shared/utils/formatResponse';

export const registerUtilController = () => {
    ipcMain.handle('util:copy', (event, dataStr: string) => copy(dataStr));
    ipcMain.handle('util:download', (event, dataStr: string) => download(dataStr));
    ipcMain.handle('util:open', (event, dataStr: string) => open(dataStr));
    ipcMain.handle('util:remove-local-files', (event, dataStr: string) => removeLocalFiles(dataStr));
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
    return formatResponse(() => utilService.downloadUrls(data.url));
};
const open = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        type: 'path' | 'web';
        url: string;
    };
    return formatResponse(() => utilService.open(data.type, data.url));
};

/**
 * 删除本地源文件（上传完成后按设置删除）
 */
const removeLocalFiles = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        paths: string[];
    };
    return formatResponse(() => utilService.removeLocalFiles(data.paths));
};
