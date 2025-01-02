import { ref, unref, isReactive, shallowRef } from 'vue';
import { ElMessage } from 'element-plus';
import { sleep } from '@linzb93/utils';
import { loading } from './util';

interface Option {
    delay?: number;
    showLoading?: boolean;
}

export default async function doRequest<T = any>(path: string, params?: any, options?: Option): Promise<T> {
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
    console.log('参数：');
    console.log(isReactive(params) ? unref(params) : params);
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

doRequest.send = (path: string, params: any) => {
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

// hook
export function useRequest<T = any>(path: string, params?: any, options?: Option) {
    const loaded = shallowRef(false);
    const result = ref<T>();
    return {
        loaded,
        result,
        async fetch() {
            const res = await doRequest(path, params, options);
            loaded.value = true;
            result.value = res;
        },
    };
}

export const requestUtil = {
    /**
     * 复制文本
     * @param {string} text 复制的文本
     */
    copy(text: string) {
        doRequest('copy', {
            content: text,
        });
        ElMessage.success('复制成功');
    },

    /**
     * 下载文件，支持单个或批量下载
     * @param {string} url 下载地址
     * @returns
     */
    async download(url: string) {
        try {
            await doRequest('download', {
                url,
            });
        } catch (error) {
            return;
        }
        ElMessage.success('下载成功');
    },
    /**
     * 打开网站或者文件
     * @param url 网址或者本地文件地址
     */
    open(type: 'vscode' | 'path' | 'web', url: string) {
        doRequest('open', {
            type,
            url,
        });
    },
};
