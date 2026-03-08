import { join } from 'node:path';
import { BrowserWindow, screen, shell, app } from 'electron';

import { RENDERER_DIST, VITE_DEV_SERVER_URL } from '@/main/shared/constants/path';
let mainWindow: BrowserWindow;
export const windowManager = {
    createMainWindow() {
        const indexHtml = join(RENDERER_DIST, 'index.html');
        const preload = join(__dirname, '../preload/index.mjs');
        mainWindow = new BrowserWindow({
            title: 'Ali OSS Browser',
            webPreferences: {
                spellcheck: false,
                preload,
            },
        });

        if (VITE_DEV_SERVER_URL) {
            // #298
            mainWindow.loadURL(VITE_DEV_SERVER_URL);
            // Open devTool if the app is not packaged
            // win.webContents.openDevTools();
        } else {
            mainWindow.loadFile(indexHtml);
        }
    },
    getMainWindow() {
        return mainWindow;
    },
};
