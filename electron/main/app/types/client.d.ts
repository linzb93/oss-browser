declare module 'ali-oss' {
    import { Readable } from 'node:stream';
    interface OssConfig {
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
        domain: string;
    }
    interface OSSObject {
        objects: {
            /**
             * 单位：B
             */
            size: number;
            /**
             * 不含http的地址，从bucket下的根目录开始，一直到文件名称及拓展名
             */
            name?: string;
            type: string;
            /**
             * 含http的完整地址
             */
            url: string;
        }[];
        /**
         * 完整的目录列表
         */
        prefixes: string[];
        /**
         * 查询下一页列表用的token
         */
        nextContinuationToken: string;
    }
    export default class OSS {
        constructor(config: OssConfig);
        /**
         * 上传文件，或者创建目录
         * @param {string} uploadName - 不含http的完整地址
         * @param {string | Buffer} localPath - 本地文件的地址，或者是Buffer
         */
        put(
            uploadName: string,
            localPath: string | Buffer
        ): Promise<{
            name: string;
        }>;
        putStream(path: string, stream: Readable): void;
        multipartUpload(
            prefix: string,
            path: string,
            {
                progress,
            }: {
                progress: (percent: number) => void;
            }
        ): Promise<string>;
        listV2(obj: { 'prefix': string; 'delimiter': string; 'max-keys': number }): Promise<OSSObject>;
        /**
         *
         * @param {string} file - 不含http的完整地址
         */
        delete(
            obj:
                | string
                | {
                      prefix: string;
                  }
        ): Promise<void>;
    }
}
