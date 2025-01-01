export interface AddOptions {
    /**
     * 上传目录
     */
    prefix: string;
    /**
     * 上传文件在本机的地址,Windows系统下记得转换分隔符
     */
    name: string;
    type: 'directory' | 'file';
}
