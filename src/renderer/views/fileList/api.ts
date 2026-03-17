import request from '@/renderer/helpers/request';
import {
    ResponseTableItem,
    AddParams,
    CollectItem,
    IPage,
    SettingInfo,
    TemplateItem,
    IHistroyResponse,
} from './shared/types';

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
export const addDirectory = async (params: AddParams) => {
    return request('oss:add-directory', params);
};
/**
 * Delete files or directories
 * @param {object} data - Data containing paths to delete
 * @param {string} data.paths - Comma separated paths
 * @returns {Promise<any>}
 */
export const deleteItem = async (data: { paths: string }) => {
    return request('oss:delete', data);
};
/**
 * Get collection list
 * @returns {Promise<CollectItem[]>} List of collected items
 */
export function getCollect(): Promise<CollectItem[]> {
    return request('collect:get-list');
}
/**
 * Add a path to collection
 * @param {object} data - Data to add
 * @param {string} data.path - Path to collect
 * @returns {Promise<any>}
 */
export function addCollect(data: { path: string }) {
    return request('collect:add', data);
}
/**
 * Set collection list (update all)
 * @param {CollectItem[]} list - New list of collections
 * @returns {Promise<any>}
 */
export function setCollect(list: CollectItem[]) {
    return request('collect:set', list);
}

/**
 * Get upload history list
 * @param {IPage} query - Pagination query
 * @returns {Promise<IHistroyResponse>} History list with pagination info
 */
export function getHistoryList(query: IPage): Promise<IHistroyResponse> {
    return request('history:get-list', query);
}
/**
 * Remove history items
 * @param {string[]} ids - List of history IDs to remove
 * @returns {Promise<any>}
 */
export function removeHistory(ids: string[]) {
    return request('history:remove', ids);
}
/**
 * Get user settings
 * @returns {Promise<SettingInfo>} User settings
 */
export function getSetting(): Promise<SettingInfo> {
    return request('setting:get');
}
/**
 * Save user settings
 * @param {SettingInfo} data - Settings to save
 * @returns {Promise<any>}
 */
export function saveSetting(data: SettingInfo) {
    return request('setting:save', data);
}
/**
 * Set home path
 * @param {object} data - Data containing path
 * @param {string} data.path - New home path
 * @returns {Promise<any>}
 */
export function setHome(data: { path: string }) {
    return request('setting:set-home', data);
}
/**
 * Get template item details
 * @param {object} data - Data containing ID
 * @param {number} data.id - Template ID
 * @returns {Promise<TemplateItem>} Template details
 */
export function getTemplateItem(data: { id: number }): Promise<TemplateItem> {
    return request('template:get-detail', data);
}
/**
 * Get template list
 * @returns {Promise<Omit<TemplateItem, 'content'>[]>} List of templates (without content)
 */
export function getTemplateList(): Promise<Omit<TemplateItem, 'content'>[]> {
    return request('template:get-list');
}
/**
 * Add a new template
 * @param {Omit<TemplateItem, 'id'>} data - Template data without ID
 * @returns {Promise<any>}
 */
export function addTemplateItem(data: Omit<TemplateItem, 'id'>) {
    return request('template:add', data);
}
/**
 * Edit an existing template
 * @param {TemplateItem} data - Template data
 * @returns {Promise<any>}
 */
export function editTemplateItem(data: TemplateItem) {
    return request('template:edit', data);
}
/**
 * Remove a template
 * @param {object} data - Data containing ID
 * @param {number} data.id - Template ID to remove
 * @returns {Promise<any>}
 */
export function removeTemplateItem(data: { id: number }) {
    return request('template:remove', data);
}
/**
 * Copy template content (e.g. CSS styles)
 * @param {object} data - Image data
 * @param {number} data.width - Image width
 * @param {number} data.height - Image height
 * @param {string} data.url - Image URL
 * @returns {Promise<any>}
 */
export function copyTemplate(data: { width: number; height: number; url: string }) {
    return request('template:copy', data);
}
