import { FileItem } from '../../../types/vo';
import { BucketObject } from 'ali-oss';
import { AppConstructorOptions } from '../oss.dto';
export default abstract class {
    /**
     * 平台id
     */
    abstract platformId: number;
    constructor(_: AppConstructorOptions) {}
    /**
     * 获取文件列表
     * @param {object} data
     * @param {string} data.prefix - 目录前缀
     * @param {boolean} [data.useToken = false] - 是否使用token。
     */
    abstract getFileList(data: { prefix: string; useToken: boolean }): Promise<{
        list: FileItem[];
        token?: string;
    }>;
    /**
     * 删除文件
     * @param {string} url - 在线地址
     */
    abstract deleteFile(url: string): Promise<any>;
    /**
     * 创建目录
     */
    abstract addDirectory(params: { prefix: string; names: string }): Promise<void>;

    /**
     * 上传文件
     * @param {string} prefix 前缀
     */
    abstract upload(
        prefix: string,
        pathItem: {
            ossPath: string;
            localPath: string;
        }
    ): Promise<void>;
    /**
     * 监听上传进度
     */
    abstract addUploadListener(callback: (data: { path: string; progress: number; size: number }) => void): void;
    /**
     * 获取账号下的所有bucket
     */
    abstract getBuckets(): Promise<BucketObject[]>;
    abstract download(path: string): Promise<void>;
}
