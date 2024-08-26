import { FileItem } from "../types/vo";

export default abstract class {
    /**
     * 平台id
     */
    abstract platformId: number;
    /**
     * 读取文件
     */
    abstract getFileList(prefix: string, config: any): Promise<FileItem[]>;
    /**
     * 删除文件
     */
    abstract deleteFile(path: string | string[], config: any): Promise<void>;
    /**
     * 创建文件或目录
     */
    abstract addPath(params: {
        prefix: string;
        name: string | string[];
        type: "directory" | "file";
        config: any;
    }): Promise<void>;
}
