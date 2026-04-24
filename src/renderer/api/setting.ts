import { request } from '@/renderer/utils/request';
import type { SettingInfo } from '@/shared/types';

/**
 * 获取用户设置
 * @returns {Promise<SettingInfo>} 用户设置
 */
export function getSetting(): Promise<SettingInfo> {
    return request('setting:get');
}
/**
 * 保存用户设置
 * @param {SettingInfo} data - 用户设置
 * @returns {Promise<void>}
 */
export function saveSetting(data: SettingInfo): Promise<void> {
    return request('setting:save', data);
}
/**
 * 设置默认首页地址
 * @param {object} data - 默认首页地址数据
 * @param {string} data.path - 默认首页地址
 * @returns {Promise<void>}
 */
export function setHome(data: { path: string }): Promise<void> {
    return request('setting:set-home', data);
}
