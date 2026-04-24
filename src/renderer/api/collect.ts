import { request } from '@/renderer/utils/request';
import type { CollectItem } from '@/shared/types';

/**
 * 获取收藏列表
 * @returns {Promise<CollectItem[]>} 收藏列表
 */
export function getCollect(): Promise<CollectItem[]> {
    return request('collect:get-list');
}
/**
 * 添加收藏路径
 * @param {object} data - 添加数据
 * @param {string} data.path - 要收藏的路径
 * @returns {Promise<any>}
 */
export function addCollect(data: { path: string }): Promise<any> {
    return request('collect:add', data);
}
/**
 * 设置收藏列表
 * @param {CollectItem[]} list - 新收藏列表
 * @returns {Promise<any>}
 */
export function setCollect(list: CollectItem[]): Promise<any> {
    return request('collect:set', list);
}
