import { join } from 'node:path';
import { app } from 'electron';
import unhandled from 'electron-unhandled';
import { createApp } from '../modules/app/app.service';
import router from '../router';

const APP_ROOT = join(__dirname, '../..');
export const RENDERER_DIST = join(APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

unhandled();

const isMac = process.platform === 'darwin';
if (!isMac) {
    app.setAppUserModelId(app.getName());
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

createApp({
    router,
});
