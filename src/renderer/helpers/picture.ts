import pathUtil from '@/renderer/utils/path';
import type { TableItem } from '@/shared/types';

export const isPic = (item: TableItem) => {
    return ['jpg', 'png', 'jpeg', 'gif', 'webp'].includes(pathUtil.extname(item.name));
};
