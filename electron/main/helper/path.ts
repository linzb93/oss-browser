import { basename } from 'node:path';
/**
 * 获取本地文件的baseName 兼容Windows系统
 */
export function getLocalFileBaseName(path: string) {
    return basename(formatLocalFilePath(path));
}
/**
 * 格式化本地文件路径 兼容Windows系统
 */
export function formatLocalFilePath(path: string) {
    return path.replace(/\\/g, '/');
}
