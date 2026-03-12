import { app } from 'electron';
import unhandled from 'electron-unhandled';
import { createApp } from './lifecycle';
import { RENDERER_DIST, VITE_DEV_SERVER_URL } from '@/main/shared/constants/path';
export { RENDERER_DIST, VITE_DEV_SERVER_URL };

unhandled();

const isMac = process.platform === 'darwin';
if (!isMac) {
    app.setAppUserModelId(app.getName());
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

createApp();
