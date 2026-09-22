import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// preload 产物为 CJS，没有 ESM 的 import.meta；改用 fileURLToPath 以兼容两种格式
export const getPreloadPath = (filePath: string) => {
    const __dirname = join(fileURLToPath(import.meta.url), '..');
    return join(__dirname, filePath);
};
