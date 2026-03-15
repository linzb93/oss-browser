declare module 'ali-oss' {
    import { Readable } from 'node:stream';

    export interface Options {
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
        domain: string;
        [key: string]: any;
    }
    // 兼容性别名
    type OssConfig = Options;

    export interface ListV2Result {
        objects: {
            size: number;
            name?: string;
            type: string;
            url: string;
            lastModified: string;
        }[];
        prefixes: string[];
        nextContinuationToken: string;
    }
    type OSSObject = ListV2Result;

    export interface BucketObject {
        name: string;
    }

    export interface ListBucketsResult {
        buckets: BucketObject[];
    }

    export interface MultipartUploadOptions {
        progress: (percent: number) => void;
        [key: string]: any;
    }

    export interface PutObjectOptions {
        [key: string]: any;
    }

    export interface PutObjectResult {
        name: string;
        [key: string]: any;
    }

    export interface MultipartUploadResult {
        name: string;
        [key: string]: any;
    }

    export interface DeleteResult {
        [key: string]: any;
    }

    export interface ListV2Options {
        'prefix': string;
        'delimiter'?: string;
        'max-keys'?: number;
        [key: string]: any;
    }

    export interface RequestOptions {
        [key: string]: any;
    }

    export type ListBucketsQueryType = any;

    export default class OSS {
        constructor(config: Options);

        put(uploadName: string, localPath: string | Buffer, options?: PutObjectOptions): Promise<PutObjectResult>;

        putStream(path: string, stream: Readable): void;

        multipartUpload(name: string, path: string, options?: MultipartUploadOptions): Promise<MultipartUploadResult>;

        listV2(obj: ListV2Options, options?: RequestOptions): Promise<ListV2Result>;

        delete(name: string, options?: RequestOptions): Promise<DeleteResult>;

        listBuckets(query?: ListBucketsQueryType | null, options?: RequestOptions): Promise<ListBucketsResult>;
    }
}
