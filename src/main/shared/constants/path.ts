import { join, dirname } from 'node:path';
import { app } from 'electron';
import { fileURLToPath } from 'node:url';

export const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, '../..');
export const RENDERER_DIST = join(APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
export const MAIN_DIST = join(APP_ROOT, 'dist-electron');
export const root = join(app.getPath('userData'), 'UserData');
export const tempPath = join(root, '.temp');
export const serverStaticPath = join(root, 'pages');
export const publicPath = join(app.getAppPath(), './public');
