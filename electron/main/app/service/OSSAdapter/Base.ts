import { FileItem } from '../../types/vo';

export default abstract class {
    /**
     * 平台id
     */
    abstract platformId: number;
    /**
     * 读取文件
     */
    abstract getFileList(prefix: string): Promise<{
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
}
