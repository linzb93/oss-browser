import { join } from 'node:path';
import { __dirname } from '@/main/enums/index.enum';
const APP_ROOT = join(__dirname, '../..');
export const RENDERER_DIST = join(APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
