import request from './shared/request';

interface ListParams {
    prefix: string;
    useToken: boolean;
}

export const getTableList = async (params: ListParams) => {
    return await request('oss-get-list', params);
};

interface AddParams {
    prefix: string;
    name: string;
    type: 'directory' | 'files';
}
export const addPath = async (params: AddParams) => {
    request('oss-add-path', params);
};

export const deleteItem = async (data: { path: string }) => {
    await request('oss-delete', data);
};
