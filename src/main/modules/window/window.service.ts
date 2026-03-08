import { BrowserWindow } from 'electron';

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
