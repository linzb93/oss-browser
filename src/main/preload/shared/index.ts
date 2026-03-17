import { join } from 'node:path';
import { __dirname } from '../../shared/constants/path';

export const getPreloadPath = (filePath: string) => {
    return join(__dirname, filePath);
};
