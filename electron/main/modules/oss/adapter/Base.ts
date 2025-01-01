import { FileItem } from '../../../types/vo';
import { BucketObject } from 'ali-oss';
export default abstract class {
    /**
     * 平台id
     */
    abstract platformId: number;
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
    abstract deleteFile(url: string): Promise<void>;
    /**
     * 创建文件或目录
     */
    abstract addPath(params: { prefix: string; name: string; type: 'directory' | 'file' }): Promise<void>;

    /**
     * 上传文件
     * @param {string} prefix 前缀
     * @param {string} path 本地文件地址
     */
    abstract upload(prefix: string, path: string): Promise<void>;
    /**
     * 监听上传进度
     */
    abstract addUploadListener(callback: (data: { name: string; progress: number; size: number }) => void): void;
    /**
     * @description
     * 设置文件上传的边界。
     * small: 小文件，直接上传；
     * large: 大文件，用分片上传
     */
    setUploadFileSizeEdge(_: { large: string; small: string }) {
        throw new Error('Please set this size edge');
    }
    abstract getBuckets(): Promise<BucketObject[]>;
}
