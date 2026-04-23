import { IPageResponse } from './common';
export interface HistoryItem {
    id: string;
    path: string;
    createTime: string;
}
export type IHistroyResponse = IPageResponse<HistoryItem>;
