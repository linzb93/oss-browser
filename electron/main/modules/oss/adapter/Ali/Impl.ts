import { basename, join, extname } from 'node:path';
import { omit } from 'lodash-es';
import bytes from 'bytes';
import OSS from 'ali-oss';
import fs from 'fs-extra';
import pMap from 'p-map';
import BaseOss from '../Base';
import { FileItem } from '../../../../types/vo';
import sql from '../../../../helper/sql';
import slash from 'slash';
import { AppConstructorOptions } from '../../oss.dto';

type uploadProgressCallback = (data: { path: string; progress: number; size: number }) => void;

/**
 * @class
 * @see https://help.aliyun.com/zh/oss/developer-reference/list-objects-5?spm=a2c4g.11186623.0.i2
 */
export default class extends BaseOss {
    readonly platformId = 1;
    /**
     * 阿里oss客户端实例
     */
    private client: OSS;
    /**
     * 上传事件回调
     */
    private uploadCallback: uploadProgressCallback;
    protected sizeBoundary = '';
    /**
     * 分页加载用的，根据这个token获取下一批数据
     */
    private nextContinuationToken: string;
    /**
     * 当前prefix和prevFilePrefix相同时，才用nextContinuationToken。
     * 否则不用这个token，并清空prevFilePrefix
     */
    private prevFilePrefix: string;

    constructor(options: AppConstructorOptions) {
        super(options);
        this.sizeBoundary = options.sizeBoundary;
        sql((db) => {
            this.client = new OSS(omit(db.account, ['id', 'platform', 'name']));
        });
    }
    async getFileList(data: { prefix: string; useToken: boolean }): Promise<{
        list: FileItem[];
        token: string;
    }> {
        const { client } = this;
        let restParams = {} as {
            'continuation-token'?: string;
        };
        if (data.prefix === this.prevFilePrefix && data.useToken) {
            restParams['continuation-token'] = this.nextContinuationToken;
        }
        const result = await client.listV2({
            'prefix': data.prefix,
            'delimiter': '/',
            'max-keys': 40,
            ...restParams,
        });
        this.prevFilePrefix = data.prefix;
        this.nextContinuationToken = result.nextContinuationToken;

        /**
         * objects会返回目录下所有的文件和目录，根据size字段判断是不是目录
         * prefixes只会返回目录
         */
        const files = result.objects
            .filter((obj) => obj.size > 0) // 移除顶层目录
            .map((obj) => ({
                name: basename(obj.name),
                type: extname(obj.name),
                size: obj.size,
                lastModified: obj.lastModified,
            }));
        const dirs = result.prefixes
            ? result.prefixes.map((subDir) => ({
                  name: subDir.split('/').slice(-2)[0],
                  type: 'dir',
                  size: 0,
              }))
            : [];
        const list = dirs.concat(files);

        return {
            list,
            token: this.nextContinuationToken,
        };
    }
    async addDirectory(params: { prefix: string; names: string }): Promise<void> {
        const { client } = this;
        await client.put(`${params.prefix}${params.names}/`, Buffer.from(''));
    }
    private async isEmptyDir(path: string) {
        const { client } = this;
        const result = await client.listV2({
            'prefix': path,
            'delimiter': '/',
            'max-keys': 1,
        });
        if (result.objects.length === 1 && result.objects[0].name !== path) {
            return false;
        }
        return true;
    }
    async deleteFile(paths: string): Promise<any> {
        const { client } = this;
        const pathList = paths.split(',');
        const unsuccessfulList = [];
        try {
            await pMap(
                pathList,
                async (path) => {
                    if (path.endsWith('/')) {
                        // 是目录，先检查是否为空
                        const isEmpty = await this.isEmptyDir(path);
                        if (!isEmpty) {
                            unsuccessfulList.push(basename(path));
                            return;
                        }
                    }
                    return client.delete(path);
                },
                {
                    concurrency: 4,
                }
            );
            return unsuccessfulList;
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * 上传文件
     * @param prefix oss目录
     * @param path 本地地址
     */
    async upload(
        prefix: string,
        pathItem: {
            ossPath: string;
            localPath: string;
        }
    ) {
        const fileStats = await fs.stat(pathItem.localPath);
        const { size } = fileStats;
        if (size < bytes(this.sizeBoundary)) {
            await this.client.put(`${prefix}${pathItem.ossPath}`, pathItem.localPath);
            this.postUploadProgress({
                path: slash(join(prefix, basename(pathItem.ossPath))),
                progress: 100,
                size,
            });
        } else {
            const absolutePath = slash(join(prefix, basename(pathItem.ossPath)));
            this.client.multipartUpload(absolutePath, pathItem.localPath, {
                progress: (percent) => {
                    this.postUploadProgress({
                        path: absolutePath,
                        progress: percent * 100,
                        size,
                    });
                },
            });
        }
    }
    addUploadListener(callback: uploadProgressCallback): void {
        this.uploadCallback = callback;
    }
    private postUploadProgress(data: { path: string; progress: number; size: number }) {
        if (typeof this.uploadCallback === 'function') {
            this.uploadCallback(data);
        }
    }
    async getBuckets() {
        const ret = await this.client.listBuckets();
        return ret.buckets.map((item) => ({
            name: item.name,
        }));
    }
}
