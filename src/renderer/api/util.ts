import { request } from '@/renderer/utils/request';

/**
 * 删除本地文件或目录
 * @param {string[]} paths - 本地文件绝对路径
 * @returns {Promise<void>}
 */
export function removeLocalFiles(paths: string[]): Promise<void> {
    return request('util:remove-local-files', { paths });
}
