import request from '@/renderer/utils/request';
import type { ResponseTableItem, AddParams } from '@/shared/types/oss';
/**
 * Get file list from OSS
 * @param {object} params - Query parameters
 * @param {string} params.prefix - Path prefix
 * @param {boolean} params.useToken - Whether to use token for pagination
 * @returns {Promise<{list: ResponseTableItem[], token: string}>} File list and next page token
 */
export function getList(params: { prefix: string; useToken: boolean }): Promise<{
    list: ResponseTableItem[];
    token: string;
}> {
    return request('oss:get-list', params);
}
/**
 * Add a new directory
 * @param {AddParams} params - Parameters for adding directory
 * @returns {Promise<any>}
 */
export const addDirectory = async (params: AddParams): Promise<any> => {
    return request('oss:add-directory', params);
};
/**
 * Delete files or directories
 * @param {object} data - Data containing paths to delete
 * @param {string} data.paths - Comma separated paths
 * @returns {Promise<any>}
 */
export const deleteItem = async (data: { paths: string }): Promise<any> => {
    return request('oss:delete', data);
};
