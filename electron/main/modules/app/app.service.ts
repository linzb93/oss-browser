import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import init from '../../providers/init';
import unhandled from 'electron-unhandled';
import { __dirname } from '../../enums/index.enum';
import { setWindow } from '../window/window.service';
import createMenu from '../menu/menu.service';
import createContextMenu from '../menu/contextMenu.service';

interface IAppOptions {
    router: Function;
}
export function createApp(options: IAppOptions) {
    app.whenReady().then(() => {
        init();
        createWindow();
        setWindow(win);
        createMenu();
        createContextMenu(win);
        options.router();
    });
    setting();
}
let win: BrowserWindow | null = null;
const APP_ROOT = join(__dirname, '../..');
export const MAIN_DIST = join(APP_ROOT, 'dist-electron');
export const RENDERER_DIST = join(APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

const preload = join(__dirname, '../preload/index.mjs');
const indexHtml = join(RENDERER_DIST, 'index.html');

function setting() {
    unhandled();
    const isMac = process.platform === 'darwin';
    // Set application name for Windows 10+ notifications
    if (!isMac) app.setAppUserModelId(app.getName());

    if (!app.requestSingleInstanceLock()) {
        app.quit();
        process.exit(0);
    }
    app.on('window-all-closed', () => {
        win = null;
        app.quit();
    });
}
async function createWindow() {
    win = new BrowserWindow({
        title: 'Ali OSS Browser',
        webPreferences: {
            spellcheck: false,
            preload,
        },
    });

    if (VITE_DEV_SERVER_URL) {
        // #298
        win.loadURL(VITE_DEV_SERVER_URL);
        // Open devTool if the app is not packaged
        // win.webContents.openDevTools();
    } else {
        win.loadFile(indexHtml);
    }
}
