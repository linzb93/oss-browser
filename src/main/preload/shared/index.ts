import { join } from 'node:path';
export const getPreloadPath = (filePath: string) => {
    return join(__dirname, filePath);
};
