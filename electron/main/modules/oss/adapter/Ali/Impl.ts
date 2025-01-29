import { basename, join, dirname, extname } from 'node:path';
import { omit } from 'lodash-es';
import bytes from 'bytes';
import OSS from 'ali-oss';
import fs from 'fs-extra';
import pMap from 'p-map';
import sql from '../../../../helper/sql';
import BaseOss from '../Base';
import * as utilService from '../../../util/util.service';
import { FileItem } from '../../../../types/vo';
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
    }
    async init() {
        await sql((db) => {
            const account = db.accounts.find((item) => item.id === db.defaultAppId);
            this.client = new OSS(omit(account, ['id', 'platform', 'name']));
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
    /**
     * 获取一个目录下的所有文件（含子目录里面的文件）
     */
    private async getAllFileUnderDirectory(path: string): Promise<string[]> {
        // 存放文件完整的oss路径
        const ret = [];
        let nextContinuationToken = '-1';
        while (nextContinuationToken) {
            const restParams =
                nextContinuationToken === '-1'
                    ? {}
                    : {
                          'continuation-token': nextContinuationToken,
                      };
            const res = await this.client.listV2({
                'prefix': path,
                'max-keys': 100,
                ...restParams,
            });
            nextContinuationToken = res.nextContinuationToken;
            ret.push(res.objects.map((item) => item.name));
        }
        return ret.flat();
    }
    async addDirectory(params: { prefix: string; names: string }): Promise<void> {
        const { client } = this;
        await client.put(`${params.prefix}${params.names}/`, Buffer.from(''));
    }
    async deleteFile(paths: string): Promise<any> {
        const { client } = this;
        const pathList = paths.split(',');
        try {
            await pMap(
                pathList,
                async (path) => {
                    if (path.endsWith('/')) {
                        const list = await this.getAllFileUnderDirectory(path);
                        return await pMap(list, (item) => client.delete(item), { concurrency: 4 });
                    }
                    return client.delete(path);
                },
                {
                    concurrency: 4,
                }
            );
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
                path: slash(join(prefix, pathItem.ossPath)),
                progress: 100,
                size,
            });
        } else {
            const absolutePath = slash(join(prefix, pathItem.ossPath));
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
    /**
     * 下载文件
     * @param callback
     */
    async download(paths: string) {
        const account = await sql((db) => db.accounts.find((item) => item.id === db.defaultAppId));
        const pathList = paths.split(',');
        const dir = dirname(pathList[0].replace(`${account.domain}/`, ''));
        const list = await pMap(
            pathList,
            async (path) => {
                if (path.endsWith('/')) {
                    return await this.getAllFileUnderDirectory(path.replace(`${account.domain}/`, ''));
                }
                return [path.replace(`${account.domain}/`, '')];
            },
            {
                concurrency: 4,
            }
        );
        await utilService.download(
            list
                .flat()
                .map((item) => `${account.domain}/${item}`)
                .join(','),
            dir
        );
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
