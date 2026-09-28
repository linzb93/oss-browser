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
    ipcMain.handle('oss:copy', (event, dataStr: string) => copy(dataStr));
    ipcMain.handle('oss:set-current-path', (event, dataStr: string) => setCurrentPath(dataStr));
    ipcMain.handle('oss:upload', (event, data: string) => upload(data));
    ipcMain.handle('oss:copy-online-file', (event, dataStr: string) => copyOnlineFile(dataStr));
};

const getFileList = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        prefix: string;
        pageSize: number;
        direction: 'reset' | 'next' | 'prev';
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

const copy = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        name: string;
        path: string;
    };
    return formatResponse(() => ossService.setCopiedFile({ name: data.name, path: data.path }));
};

const setCurrentPath = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        path: string;
    };
    return formatResponse(() => ossService.setCurrentPath(data.path));
};

const download = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        url: string;
    };
    return formatResponse(() => ossService.download(data.url));
};

const upload = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        prefix: string;
    names: string;
    type: string;
    };
    return formatResponse(() => ossService.upload(data));
};

/**
 * 复制在线文件：把在线地址的文件以流的方式上传到指定目录
 */
const copyOnlineFile = (dataStr: string) => {
    const data = JSON.parse(dataStr) as {
        prefix: string;
        url: string;
        name?: string;
    };
    return formatResponse(() => ossService.copyOnlineFile(data));
};
