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

    async delete(name: string, options?: RequestOptions): Promise<DeleteResult> {
        return this.client.delete(name, options);
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
};
