import pathUtil from '@/renderer/utils/path';

export const isPic = (item: { name: string }) => {
    return ['jpg', 'png', 'jpeg', 'gif', 'webp'].includes(pathUtil.extname(item.name));
};
