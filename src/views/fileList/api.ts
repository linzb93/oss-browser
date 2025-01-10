import request from '@/helpers/request';
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
    return request('oss-get-list', params);
}
export const addDirectory = async (params: AddParams) => {
    return request('oss-add-directory', params);
};
export const deleteItem = async (data: { paths: string }) => {
    return request('oss-delete', data);
};
export function getCollect(): Promise<CollectItem[]> {
    return request('get-collect');
}
export function addCollect(data: { path: string }) {
    return request('add-collect', data);
}
export function setCollect(list: CollectItem[]) {
    return request('set-collect', list);
}

export function getHistoryList(query: IPage): Promise<IHistroyResponse> {
    return request('get-history', query);
}
export function getSetting(): Promise<SettingInfo> {
    return request('get-setting');
}
export function saveSetting(data: SettingInfo) {
    return request('save-setting', data);
}
export function setHome(data: { path: string }) {
    return request('set-home', data);
}
export function getTemplateItem(data: { id: number }): Promise<TemplateItem> {
    return request('get-template', data);
}
export function getTemplateList(): Promise<Omit<TemplateItem, 'content'>[]> {
    return request('get-template-list');
}
export function addTemplateItem(data: Omit<TemplateItem, 'id'>) {
    return request('add-template', data);
}
export function editTemplateItem(data: TemplateItem) {
    return request('edit-template', data);
}
export function removeTemplateItem(data: { id: number }) {
    return request('remove-template', data);
}
export function copyTemplate(data: { width: number; height: number; url: string }) {
    return request('copy-template', data);
}
