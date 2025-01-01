import { type IpcMainEvent } from 'electron';
import * as ossService from './oss.service';
import { AddOptions } from './oss.dto';
import App from './adapter/Base';
import { OssConfig } from 'ali-oss';
export default {
    add(AppCtor: new () => App) {
        return ossService.add(AppCtor);
    },
    getFileList(params: string) {
        const data = JSON.parse(params) as {
            prefix: string;
            useToken: boolean;
        };
        return ossService.getFileList(data);
    },
    deleteFile(params: string) {
        const data = JSON.parse(params) as {
            path: string;
        };
        return ossService.deleteFile(data.path);
    },
    addPath(params: string) {
        const data = JSON.parse(params) as AddOptions;
        return ossService.addPath(data);
    },
    upload(e: IpcMainEvent, data: AddOptions) {
        return ossService.upload(e, data);
    },
    getBuckets(params: string) {
        const data = JSON.parse(params) as OssConfig;
        return ossService.getBuckets(data);
    },
};
