export interface AddOptions {
    /**
     * 上传目录
     */
    prefix: string;
    /**
     * 上传文件在本机的地址,Windows系统下记得转换分隔符
     */
    names: string;
    type: 'directory' | 'file';
}

export interface AddDirectory {
    /**
     * 上传目录
     */
    prefix: string;
    files: string[];
}

export interface IFileItem {
    /**
     * 文件名
     */
    name: string;
    /**
     * 文件绝对路径
     */
    path: string;
    /**
     * 文件的网址
     */
    url: string;
    /**
     * 文件类型
     */
    type: string;
    /**
     * 文件大小
     */
    size: number;
}

export interface AppConstructorOptions {
    sizeBoundary: string;
}
