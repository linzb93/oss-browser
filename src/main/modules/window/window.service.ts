import { BrowserWindow, ipcMain } from 'electron';

let win: BrowserWindow;
export function setWindow(instance: BrowserWindow) {
    win = instance;
}
export function getWindow() {
    return win;
}

export function postRenderer(eventName: string, params?: any) {
    win.webContents.send('main-post', {
        method: eventName,
        data: params,
    });
}

let requestId = 0;
const pendingRequests = new Map<number, (data: any) => void>();
let receiverRegistered = false;

function ensureReceiver() {
    if (receiverRegistered) {
        return;
    }
    receiverRegistered = true;
    ipcMain.on('main-post-receive', (_event, raw: string) => {
        const { requestId, data } = JSON.parse(raw);
        const resolve = pendingRequests.get(requestId);
        if (resolve) {
            pendingRequests.delete(requestId);
            resolve(data);
        }
    });
}

/**
 * 向渲染层发起一次请求，并等待渲染层回传结果
 * @param method 请求名称
 * @param data 请求参数
 * @returns 渲染层回传的数据
 */
export function requestRenderer<T = any>(method: string, data?: any): Promise<T | undefined> {
    return new Promise((resolve) => {
        ensureReceiver();
        const id = ++requestId;
        pendingRequests.set(id, resolve);
        win.webContents.send('main-post', {
            requestId: id,
            method,
            data,
            listener: true,
        });
    });
}
