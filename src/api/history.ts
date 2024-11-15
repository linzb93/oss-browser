import request from './shared/request';

interface IPage {
    pageIndex: number;
    pageSize: number;
}
export const getHistoryList = async (query: IPage) => {
    return await request('get-history', query);
};
