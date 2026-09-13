import { basename, join, dirname, extname } from 'node:path';
import { omit } from 'lodash-es';
import bytes from 'bytes';
import { AliOssClient } from '@/main/infra/ali-oss';
import fs from 'fs-extra';
import pMap from 'p-map';
import { sql } from '@/main/infra/sql';
import BaseOss from '../Base';
import * as utilService from '@/main/modules/util/util.service';
import { FileItem } from '@/main/types/vo';
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
    private client!: AliOssClient;
    /**
     * 上传事件回调
     */
    private uploadCallback?: uploadProgressCallback;
    protected sizeBoundary = '';
    /**
     * 分页加载用的，根据这个token获取下一批数据
     */
    private nextContinuationToken: string = '';
    /**
     * 当前prefix和prevFilePrefix相同时，才用nextContinuationToken。
     * 否则不用这个token，并清空prevFilePrefix
     */
    private prevFilePrefix: string = '';
    /**
     * 已加载过的 continuation-token 快照。
     * - tokenStack[0] 永远是 ''（即"加载第 1 页的入口 token"，对应不传 continuation-token）
     * - tokenStack[N] = 加载第 N 页后服务端返回的 nextContinuationToken，
     *                  也就是加载第 N+1 页时应当使用的入口 token
     *   例如 tokenStack = ['', 'tok2', 'tok3'] 表示：
     *     - 加载第 1 页：入口 token = ''（首页）
     *     - 加载第 2 页：入口 token = 'tok2'（这是第 1 页响应里的 nextToken）
     *     - 加载第 3 页：入口 token = 'tok3'（这是第 2 页响应里的 nextToken）
     *   推论：加载第 N 页时使用 tokenStack[N-1] 作为入口；加载完成后写 tokenStack[N]。
     */
    private tokenStack: string[] = [''];
    /**
     * 当前页码（从 1 开始），与 tokenStack 同步更新；0 表示尚未加载任何页
     */
    private currentPage: number = 0;

    constructor(options: AppConstructorOptions) {
        super(options);
        this.sizeBoundary = options.sizeBoundary;
    }
    async init() {
        await sql((db) => {
            const account = db.accounts.find((item) => item.id === db.defaultAppId);
            this.client = new AliOssClient(omit(account, ['id', 'platform', 'name']));
        });
    }
    async getFileList(data: {
        prefix: string;
        pageSize: number;
        direction: 'reset' | 'next' | 'prev';
    }): Promise<{
        list: FileItem[];
        hasNext: boolean;
        hasPrev: boolean;
        page: number;
    }> {
        const { client } = this;
        const { prefix, pageSize, direction } = data;
        const restParams: { 'continuation-token'?: string } = {};

        // prefix 切换时强制重置翻页状态
        if (this.prevFilePrefix !== prefix) {
            this.tokenStack = [''];
            this.currentPage = 0;
        }

        // 计算本次要加载的目标页
        let targetPage: number;
        if (direction === 'next') {
            targetPage = this.currentPage + 1;
        } else if (direction === 'prev') {
            // aliyun listV2 不支持反向翻页，prev 必须借助已缓存的 tokenStack 直接定位。
            targetPage = this.currentPage - 1;
            if (targetPage < 1) {
                targetPage = 1;
            }
        } else {
            // reset
            this.tokenStack = [''];
            this.currentPage = 0;
            targetPage = 1;
        }

        // 加载目标页：入口 token 是 tokenStack[targetPage - 1]
        restParams['continuation-token'] = this.tokenStack[targetPage - 1] || '';

        const result = await client.listV2({
            'prefix': prefix,
            'delimiter': '/',
            'max-keys': pageSize,
            ...restParams,
        });

        // 写入 targetPage 的 nextToken（也是 targetPage+1 的入口）
        this.tokenStack[targetPage] = result.nextContinuationToken || '';
        this.nextContinuationToken = result.nextContinuationToken || '';
        this.prevFilePrefix = prefix;
        this.currentPage = targetPage;

        /**
         * objects会返回目录下所有的文件和目录，根据size字段判断是不是目录
         * prefixes只会返回目录
         */
        const files = result.objects
            .filter((obj) => obj.size > 0) // 移除顶层目录
            .map((obj) => ({
                name: basename(obj.name || ''),
                type: extname(obj.name || ''),
                size: obj.size,
                lastModified: obj.lastModified,
            }));
        const dirs = result.prefixes
            ? result.prefixes.map((subDir) => ({
                  name: subDir.split('/').slice(-2)[0],
                  type: 'directory',
                  size: 0,
              }))
            : [];
        const list = dirs.concat(files);

        const hasNext = !!result.nextContinuationToken;
        const hasPrev = this.currentPage > 1;

        return {
            list,
            hasNext,
            hasPrev,
            page: this.currentPage,
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
            ret.push(res.objects.map((item) => item.name).filter((name): name is string => !!name));
        }
        return ret.flat();
    }
    async addDirectory(params: { prefix: string; names: string }): Promise<void> {
        const { client } = this;
        await client.put(`${params.prefix}${params.names}/`, Buffer.from(''));
    }
    async copyFile(sourcePath: string, targetPath: string): Promise<void> {
        const { client } = this;
        await client.copy(targetPath, sourcePath);
    }
    async head(name: string): Promise<boolean> {
        const { client } = this;
        try {
            await client.head(name);
            return true;
        } catch (error) {
            return false;
        }
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
                },
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
        },
    ) {
        const fileStats = await fs.stat(pathItem.localPath);
        const { size } = fileStats;
        if (size < (bytes(this.sizeBoundary) as number)) {
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
        if (!account) {
            throw new Error('Account not found');
        }
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
            },
        );
        await utilService.download(
            list
                .flat()
                .map((item) => `${account.domain}/${item}`)
                .join(','),
            dir,
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
