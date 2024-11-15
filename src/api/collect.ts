import request from './shared/request';

export const addCollect = async (data: { path: string }) => {
    return await request('add-collect', data);
};
