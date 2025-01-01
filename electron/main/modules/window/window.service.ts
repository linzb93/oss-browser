import { BrowserWindow } from 'electron';

let win: BrowserWindow;
export function setWindow(instance: BrowserWindow) {
    win = instance;
}
