import { FileItem } from '../../types/vo';

export default abstract class {
    /**
     * 平台id
     */
    abstract platformId: number;
    /**
     * 读取文件列表
     */
    abstract getFileList(data: { prefix: string; useToken: boolean }): Promise<{
        list: FileItem[];
        token?: string;
    }>;
    /**
     * 删除文件
     */
    abstract deleteFile(path: string): Promise<void>;
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
    abstract addUploadListener(callback: (path: string, progress: number) => void): void;
    /**
     * 设置文件上传的边界。
     * small: 小文件，直接上传；
     * large: 大文件，用分片上传
     */
    setUploadFileSizeEdge(map: { large: string; small: string }) {
        throw new Error('Please set this size edge');
    }
}
