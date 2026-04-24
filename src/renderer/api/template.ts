import { request } from '@/renderer/utils/request';
import type { TemplateItem } from '@/shared/types';
/**
 * 获取模板详情
 * @param {object} data - 包含模板ID的对象
 * @param {number} data.id - 模板ID
 * @returns {Promise<TemplateItem>} 模板详情
 */
export function getTemplateItem(data: { id: number }): Promise<TemplateItem> {
    return request('template:get-detail', data);
}
/**
 * 获取模板列表
 * @returns {Promise<Omit<TemplateItem, 'content'>[]>} 模板列表（不包含内容）
 */
export function getTemplateList(): Promise<Omit<TemplateItem, 'content'>[]> {
    return request('template:get-list');
}
/**
 * 添加模板项
 * @param {Omit<TemplateItem, 'id'>} data - 模板数据（不包含模板ID的对象）
 * @returns {Promise<void>}
 */
export function addTemplateItem(data: Omit<TemplateItem, 'id'>): Promise<void> {
    return request('template:add', data);
}
/**
 * 编辑模板项
 * @param {TemplateItem} data - 模板数据
 * @returns {Promise<void>}
 */
export function editTemplateItem(data: TemplateItem): Promise<void> {
    return request('template:edit', data);
}
/**
 * 删除模板项
 * @param {object} data - 包含模板ID的对象
 * @param {number} data.id - 模板ID
 * @returns {Promise<void>}
 */
export function removeTemplateItem(data: { id: number }): Promise<void> {
    return request('template:remove', data);
}
/**
 * 复制模板内容（例如CSS样式）
 * @param {object} data - 图片数据
 * @param {number} data.width - 图片宽度
 * @param {number} data.height - 图片高度
 * @param {string} data.url - 图片URL
 * @returns {Promise<void>}
 */
export function copyTemplate(data: { width: number; height: number; url: string }): Promise<void> {
    return request('template:copy', data);
}
