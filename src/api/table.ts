import request from './shared/request';

interface ListParams {
    prefix: string;
    useToken: boolean;
}

export const getTableList = async (params: ListParams) => {
    return await request('oss-get-list', params);
};
