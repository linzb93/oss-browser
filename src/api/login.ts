import request from './shared/request';
interface LoginParams {
    name: string;
    platform: number;
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    domain: string;
    id: number | string;
}

export const doLogin = async (params: LoginParams) => {
    await request('login-save', params);
};

export const getInfo = async (): Promise<LoginParams> => {
    return await request('login-get');
};
