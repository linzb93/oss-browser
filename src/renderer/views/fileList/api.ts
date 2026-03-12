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

export function getList(params: { prefix: string; useToken: boolean }): Promise<{
    list: ResponseTableItem[];
    token: string;
}> {
    return request('oss:get-list', params);
}
export const addDirectory = async (params: AddParams) => {
    return request('oss:add-directory', params);
};
export const deleteItem = async (data: { paths: string }) => {
    return request('oss:delete', data);
};
export function getCollect(): Promise<CollectItem[]> {
    return request('collect:get-list');
}
export function addCollect(data: { path: string }) {
    return request('collect:add', data);
}
export function setCollect(list: CollectItem[]) {
    return request('collect:set', list);
}

export function getHistoryList(query: IPage): Promise<IHistroyResponse> {
    return request('history:get-list', query);
}
export function removeHistory(ids: string[]) {
    return request('history:remove', ids);
}
export function getSetting(): Promise<SettingInfo> {
    return request('setting:get');
}
export function saveSetting(data: SettingInfo) {
    return request('setting:save', data);
}
export function setHome(data: { path: string }) {
    return request('setting:set-home', data);
}
export function getTemplateItem(data: { id: number }): Promise<TemplateItem> {
    return request('template:get-detail', data);
}
export function getTemplateList(): Promise<Omit<TemplateItem, 'content'>[]> {
    return request('template:get-list');
}
export function addTemplateItem(data: Omit<TemplateItem, 'id'>) {
    return request('template:add', data);
}
export function editTemplateItem(data: TemplateItem) {
    return request('template:edit', data);
}
export function removeTemplateItem(data: { id: number }) {
    return request('template:remove', data);
}
export function copyTemplate(data: { width: number; height: number; url: string }) {
    return request('template:copy', data);
}
