import request from '@/renderer/utils/request';
import type { IHistroyResponse, HistoryItem, IPageRequest } from '@/shared/types';
/**
 * 获取上传历史列表
 * @param {IPageRequest} query - 分页查询参数
 * @returns {Promise<IHistroyResponse>} 分页响应参数
 */
export function getHistoryList(query: IPageRequest): Promise<IHistroyResponse> {
    return request('history:get-list', query);
}
/**
 * 删除上传历史记录
 * @param {Pick<HistoryItem, 'id'>[]} ids - 上传历史记录ID列表，用于删除指定的上传历史记录
 * @returns {Promise<void>}
 */
export function removeHistory(ids: Pick<HistoryItem, 'id'>[]): Promise<void> {
    return request('history:remove', ids);
}
