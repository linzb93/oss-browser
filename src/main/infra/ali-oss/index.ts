import OSS, { OssConfig } from 'ali-oss';
import { AddOptions } from './type';
let currentClient: OSS = new OSS({} as OssConfig);

export const listBuckets = async () => {
    return currentClient.listBuckets();
};

export const deleteFile = async (paths: string) => {
    return currentClient.delete(paths);
};

export const addDirectory = async (param: AddOptions) => {
    return currentClient.put(param.prefix, '');
};

export const addFile = async (param: AddOptions) => {
    return currentClient.put(param.prefix + param.names, param.names);
};
