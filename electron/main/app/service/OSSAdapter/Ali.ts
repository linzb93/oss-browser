import { basename, extname } from 'node:path';
import { omit } from 'lodash-es';
import OSS from 'ali-oss';
import pMap from 'p-map';
import BaseOss from './Base';
import { FileItem } from '../../types/vo';
import sql from '../../helper/sql';

export default class extends BaseOss {
    readonly platformId = 1;
    private client: OSS;
    private domain: string;
    /**
     * 分页加载用的，根据这个token获取下一批数据
     */
    private nextContinuationToken: string;
    /**
     * 当当前prefix和prevFilePrefix相同时，才用nextContinuationToken。
     * 否则不用这个token，并清空prevFilePrefix
     */
    private prevFilePrefix: string;
    constructor() {
        super();
        sql((db) => {
            this.client = new OSS(omit(db.account, ['id', 'platform', 'name']));
            this.domain = db.account.domain;
        });
    }
    async getFileList(data: { prefix: string; useToken: boolean }): Promise<{
        list: FileItem[];
        token: string;
    }> {
        // https://help.aliyun.com/zh/oss/developer-reference/list-objects-5?spm=a2c4g.11186623.0.i2
        const { client } = this;
        let restParams = {} as any;
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
        const objects = result.objects
            .filter((obj) => obj.size > 0)
            .map((obj) => ({
                ...obj,
                name: obj.name.split('/').slice(-1)[0],
                url: obj.url.replace(/^https?:\/\/[^\/]+/, this.domain),
            }));
        const list = result.prefixes
            ? result.prefixes
                  .map((subDir) => ({
                      name: subDir.replace(/\/$/, '').split('/').slice(-1)[0],
                      type: 'dir',
                  }))
                  .concat(objects)
            : objects;
        return {
            list,
            token: this.nextContinuationToken,
        };
    }
    async addPath(params: { prefix: string; name: string; type: 'directory' | 'file' }): Promise<void> {
        const { client } = this;
        if (params.type === 'directory') {
            await client.put(`${params.prefix}${params.name}/`, Buffer.from(''));
            return;
        }
        if (params.type === 'file') {
            // name的含义是本地地址，而且一定是数组格式
            const files = params.name.split(',');
            await pMap(files, (file) => client.put(`${params.prefix}${basename(file)}`, file), {
                concurrency: 4,
            });
        }
    }
    async deleteFile(pathStr: string): Promise<void> {
        const { client } = this;
        const pathList = pathStr.split(',');
        try {
            await pMap(pathList, (path) => client.delete(path), {
                concurrency: 4,
            });
        } catch (error) {
            console.log(error);
        }
    }
}
