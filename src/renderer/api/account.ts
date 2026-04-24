import { request } from '@/renderer/utils/request';
import type { AccountItem } from '@/shared/types';

/**
 * 获取账号列表
 * @returns {Promise<AccountItem[]>} 账号列表
 */
export function getAccountList(): Promise<AccountItem[]> {
    return request('account:get-list');
}
/**
 * 删除账号
 * @param {object} data - 包含账号ID的对象
 * @param {number} data.id - 账号ID
 * @returns {Promise<void>}
 */
export function removeAccount(data: { id: number }): Promise<void> {
    return request('account:remove', data);
}

export function getAppDefaultId(): Promise<number> {
    return request('account:get-default-app-id');
}

export function getCurrentAccount(): Promise<AccountItem> {
    return request('account:get-current');
}
