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

    private sizeMap = {
        large: '',
        small: '',
    };
    /**
     * 分页加载用的，根据这个token获取下一批数据
     */
    private nextContinuationToken: string;
    /**
     * 当前prefix和prevFilePrefix相同时，才用nextContinuationToken。
     * 否则不用这个token，并清空prevFilePrefix
     */
    private prevFilePrefix: string;

    constructor() {
        super();
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
    async addPath(params: { prefix: string; names: string; type: 'directory' | 'file' }): Promise<void> {
        const { client } = this;
        if (params.type === 'directory') {
            await client.put(`${params.prefix}${params.names}/`, Buffer.from(''));
            return;
        }
        if (params.type === 'file') {
            // name的含义是本地地址，而且一定是数组格式
            const files = params.names.split(',');
            await pMap(files, (file) => client.put(`${params.prefix}${basename(slash(file))}`, file), {
                concurrency: 4,
            });
        }
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
    setUploadFileSizeEdge(map: { large: string; small: string }): void {
        this.sizeMap = map;
    }
    async upload(prefix: string, path: string) {
        const fileStats = await fs.stat(path);
        const { size } = fileStats;
        if (size < bytes(this.sizeMap.small)) {
            await this.addPath({
                type: 'file',
                prefix,
                names: path,
            });
            this.postUploadProgress({
                path: slash(join(prefix, basename(path))),
                progress: 100,
                size,
            });
        } else {
            const absolutePath = slash(join(prefix, basename(path)));
            this.client.multipartUpload(absolutePath, path, {
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
