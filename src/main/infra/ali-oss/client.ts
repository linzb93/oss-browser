import type { Readable } from 'node:stream';
import OSS, {
    Options,
    ListV2Options,
    MultipartUploadOptions,
    PutObjectOptions,
    PutObjectResult,
    MultipartUploadResult,
    ListV2Result,
    DeleteResult,
    ListBucketsResult,
    RequestOptions,
    ListBucketsQueryType,
    CopyObjectResult,
    HeadObjectResult,
} from 'ali-oss';

export class AliOssClient {
    private client: OSS;

    constructor(options: Options) {
        this.client = new OSS(options);
    }

    async listV2(query: ListV2Options, options?: RequestOptions): Promise<ListV2Result> {
        return this.client.listV2(query, options);
    }

    async put(name: string, file: any, options?: PutObjectOptions): Promise<PutObjectResult> {
        return this.client.put(name, file, options);
    }

    /**
     * 以可读流的方式上传对象，适合边下载边上传的场景。
     * ali-oss 的 put 在运行时支持可读流（内部会自动转到 putStream）：
     * 传了 contentLength 就用 Content-Length，否则用 chunked 编码。
     * @param name 对象 key
     * @param file 可读流
     * @param options 上传参数
     */
    async putStream(name: string, file: Readable, options?: PutStreamOptions): Promise<PutObjectResult> {
        return this.put(name, file, options);
    }

    async delete(name: string, options?: RequestOptions): Promise<DeleteResult> {
        return this.client.delete(name, options);
    }

    async copy(name: string, sourceName: string, options?: RequestOptions): Promise<CopyObjectResult> {
        return this.client.copy(name, sourceName, options);
    }

    async head(name: string, options?: RequestOptions): Promise<HeadObjectResult> {
        return this.client.head(name, options);
    }

    async multipartUpload(name: string, file: any, options?: MultipartUploadOptions): Promise<MultipartUploadResult> {
        return this.client.multipartUpload(name, file, options);
    }

    async listBuckets(query?: ListBucketsQueryType | null, options?: RequestOptions): Promise<ListBucketsResult> {
        return this.client.listBuckets(query, options);
    }
}

export type {
    Options as OssConfig,
    ListV2Result,
    MultipartUploadOptions,
    ListBucketsResult,
    PutObjectResult,
    DeleteResult,
    ListV2Options,
    CopyObjectResult,
    HeadObjectResult,
};

/**
 * 流式上传参数。
 * ali-oss 运行时支持 `contentLength`（缺省时使用 chunked 编码），但 @types/ali-oss 的
 * `PutStreamOptions` 把该字段之外的属性都声明成了必填，因此这里基于 `PutObjectOptions` 扩展。
 */
export type PutStreamOptions = PutObjectOptions & {
    /**
     * 可读流的字节长度，缺省时使用 chunked 编码
     */
    contentLength?: number;
};
