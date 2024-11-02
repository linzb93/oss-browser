declare module 'ali-oss' {
    interface OssConfig {
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
        domain: string;
    }
    interface OSSObject {
        objects: {
            size: number;
            name?: string;
            type: string;
            url: string;
        }[];
        prefixes: string[];
        nextContinuationToken: string;
    }
    export default class OSS {
        constructor(config: OssConfig);
        put(
            uploadName: string,
            localPath: string | Buffer
        ): Promise<{
            name: string;
        }>;
        listV2(obj: { 'prefix': string; 'delimiter': string; 'max-keys': number }): Promise<OSSObject>;
        delete(file: string): Promise<void>;
    }
}
