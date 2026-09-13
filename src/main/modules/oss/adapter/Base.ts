import { FileItem } from '../../../types/vo';
import { AppConstructorOptions, BucketObject } from '../oss.dto';

/**
 * 获取文件列表的统一入参。
 * - `direction: 'reset'` 表示重置到首页（清空翻页状态）
 * - `direction: 'next'`  表示拉取下一页
 * - `direction: 'prev'`  表示回退到上一页
 */
export interface GetFileListParams {
    prefix: string;
    pageSize: number;
    direction: 'reset' | 'next' | 'prev';
}
/**
 * 获取文件列表的统一出参。
 */
export interface GetFileListResult {
    list: FileItem[];
    hasNext: boolean;
    hasPrev: boolean;
    page: number;
}
export default abstract class {
    /**
     * 平台id
     */
    abstract platformId: number;
    constructor(_: AppConstructorOptions) {}
    abstract init(): Promise<void>;
    /**
     * 获取文件列表，支持 prev/next 双向翻页
     * @param {GetFileListParams} data 翻页参数
     */
    abstract getFileList(data: GetFileListParams): Promise<GetFileListResult>;
    /**
     * 删除文件
     * @param {string} url - 在线地址
     */
    abstract deleteFile(url: string): Promise<any>;
    /**
     * 复制文件到目标路径
     * @param {string} sourcePath - 源对象 key
     * @param {string} targetPath - 目标对象 key
     */
    abstract copyFile(sourcePath: string, targetPath: string): Promise<void>;
    /**
     * 判断对象是否存在
     * @param {string} name - 对象 key
     */
    abstract head(name: string): Promise<boolean>;
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
