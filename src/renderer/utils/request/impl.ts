import { unref, isReactive } from 'vue';
import { sleep } from '@linzb93/utils';
import { loading } from '../loading';
import { isUndefined } from 'lodash-es';
import type { Option } from './types';

export async function request<T = any>(path: string, params?: any, options?: Option): Promise<T> {
    if (options?.showLoading) {
        loading.open();
    }
    const res = await window.ipcRenderer.invoke(path, JSON.stringify(params));
    if (options?.showLoading) {
        loading.close();
    }
    if (options?.delay) {
        await sleep(options.delay);
    }
    console.groupCollapsed(`发送请求：%c${path}%c`, 'color:green', '');
    if (!isUndefined(params)) {
        console.log('参数：');
        console.log(isReactive(params) ? unref(params) : params);
    }
    console.log('收到请求结果：');
    console.log(res);
    console.groupEnd();
    if (!res) {
        return null as T;
    }
    if (!res.code && res.result !== undefined) {
        return res.result;
    }
    if (res.code !== 200) {
        return Promise.reject(res);
    }
    return res.result;
}

request.send = (path: string, params: any) => {
    window.ipcRenderer.send(path, params);
    let receiveCallback: Function;
    const fn = (_: any, args: any) => {
        if (typeof receiveCallback === 'function') {
            receiveCallback(args);
        }
    };
    window.ipcRenderer.on(`${path}-receiver`, fn);
    return {
        listener(callback: Function) {
            receiveCallback = callback;
        },
        removeListener() {
            receiveCallback = () => {};
            window.ipcRenderer.off(`${path}-receiver`, fn);
        },
    };
};
