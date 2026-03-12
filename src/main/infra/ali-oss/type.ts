import OSS, { OssConfig } from 'ali-oss';
export interface AddOptions {
    /**
     * 上传目录，目录末尾有带"/"
     */
    prefix: string;
    /**
     * 上传文件在本机的地址,Windows系统下记得转换分隔符
     */
    names: string;
}
