import { ipcMain, IpcMainEvent } from 'electron';
import { OssConfig } from 'ali-oss';
import * as ossService from '@/main/modules/oss/oss.service';
import formatResponse from '@/main/shared/utils/formatResponse';
import { AddOptions } from '@/main/modules/oss/oss.dto';

export const registerOssController = () => {
    ipcMain.handle('oss:get-list', (event, dataStr: string) => getFileList(dataStr));
    ipcMain.handle('oss:add-directory', (event, dataStr: string) => addDirectory(dataStr));
    ipcMain.handle('oss:delete', (event, dataStr: string) => deleteFile(dataStr));
    ipcMain.handle('oss:get-buckets', (event, dataStr: string) => getBuckets(dataStr));
    ipcMain.handle('oss:download', (event, dataStr: string) => download(dataStr));
    ipcMain.on('oss:upload', (event, data: AddOptions) => upload(event, data));
};

const getFileList = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        prefix: string;
        useToken: boolean;
    };
    return formatResponse(() => ossService.getFileList(data));
};

const addDirectory = (dataStr: string) => {
    const data = JSON.parse(dataStr) as AddOptions;
    return formatResponse(() => ossService.addDirectory(data));
};

const deleteFile = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        paths: string;
    };
    return formatResponse(() => ossService.deleteFile(data.paths));
};

const getBuckets = (dataStr: string) => {
    const data = JSON.parse(dataStr) as OssConfig;
    return formatResponse(() => ossService.getBuckets(data));
};

const download = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        url: string;
    };
    return formatResponse(() => ossService.download(data.url));
};

const upload = (event: IpcMainEvent, data: AddOptions) => {
    ossService.upload(event, data);
};
