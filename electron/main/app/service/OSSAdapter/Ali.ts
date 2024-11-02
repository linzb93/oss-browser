import { basename } from 'node:path';
import OSS, { OssConfig } from 'ali-oss';
import BaseOss from './Base';
import { FileItem } from '../../types/vo';
import pMap from 'p-map';
export default class extends BaseOss {
    readonly platformId = 1;
    /**
     * 分页加载用的，根据这个token获取下一批数据
     */
    private nextContinuationToken: string;
    /**
     * 当当前prefix和prevFilePrefix相同时，才用nextContinuationToken。
     * 否则不用这个token，并清空prevFilePrefix
     */
    private prevFilePrefix: string;
    async getFileList(
        prefix: string,
        config: OssConfig
    ): Promise<{
        list: FileItem[];
        token: string;
    }> {
        // https://help.aliyun.com/zh/oss/developer-reference/list-objects-5?spm=a2c4g.11186623.0.i2
        const { domain } = config;
        const client = new OSS(config);
        let restParams = {} as any;
        if (prefix === this.prevFilePrefix) {
            restParams['continuation-token'] = this.nextContinuationToken;
        }
        const result = await client.listV2({
            prefix,
            'delimiter': '/',
            'max-keys': 40,
            ...restParams,
        });
        this.prevFilePrefix = prefix;
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
                url: obj.url.replace(/^https?:\/\/[^\/]+/, domain),
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
    async deleteFile(path: string | string[], config: OssConfig): Promise<void> {
        const client = new OSS(config);
        if (Array.isArray(path)) {
            await pMap(path, (pathItem) => client.delete(pathItem), {
                concurrency: 4,
            });
        } else {
            await client.delete(path);
        }
    }
    async addPath(params: {
        prefix: string;
        name: string | string[];
        type: 'directory' | 'file';
        config: OssConfig;
    }): Promise<void> {
        const client = new OSS(params.config);
        if (params.type === 'directory') {
            await client.put(`${params.prefix}${params.name}/`, Buffer.from(''));
            return;
        }
        if (params.type === 'file') {
            // name的含义是本地地址，而且一定是数组格式
            const files = params.name as string[];
            await pMap(files, (file: string) => client.put(`${params.prefix}${basename(file)}`, file), {
                concurrency: 4,
            });
        }
    }
}
