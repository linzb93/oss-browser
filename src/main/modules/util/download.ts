import type { DownloadProgressItem } from '@/shared/types/oss';

/**
 * 推送给渲染层的下载明细条数上限。
 * 目录下载可能包含上千个文件，每个 tick 都全量推送会带来不必要的 IPC 序列化开销，
 * 因此只推送前 DETAIL_LIMIT 条，汇总数据（total/finished/failed/percent）仍按全量计算。
 */
export const DETAIL_LIMIT = 200;

/**
 * 一次下载任务的输入
 */
export interface DownloadTarget {
    /**
     * 在线地址
     */
    url: string;
    /**
     * OSS 对象 key
     */
    key: string;
    /**
     * 本地保存的相对路径（保留目录结构）
     */
    path: string;
}

/**
 * 取对象 key 的「目录锚点」：
 * - 选中目录（以 / 结尾）时锚点就是目录本身，保证本地保留目录名
 * - 选中文件时锚点是它所在目录，保证单文件/同目录批量下载被平铺到所选目录
 * @param key OSS 对象 key
 * @returns 以 / 结尾的目录锚点，文件位于根目录时为空串
 * @example
 * toDirAnchor('a.jpg') // ''
 * toDirAnchor('a/b.jpg') // 'a/'
 * toDirAnchor('photos/') // 'photos/'
 */
export const toDirAnchor = (key: string): string => {
    if (key.endsWith('/')) {
        return key;
    }
    const index = key.lastIndexOf('/');
    return index === -1 ? '' : key.slice(0, index + 1);
};

/**
 * 求若干目录锚点的公共目录前缀。
 * 逐字符缩短前缀后回退到最后一个 `/`，避免把 `pho` 这种半截目录名当成公共前缀。
 * @param anchors 目录锚点列表
 * @returns 以 / 结尾的公共前缀；没有公共目录时为空串
 * @example
 * commonDirPrefix(['a/b/', 'a/c/']) // 'a/'
 * commonDirPrefix(['', 'photos/']) // ''
 * commonDirPrefix(['photos/', 'pho/']) // ''
 */
export const commonDirPrefix = (anchors: string[]): string => {
    if (!anchors.length) {
        return '';
    }
    let prefix = anchors[0];
    for (const anchor of anchors) {
        while (prefix && !anchor.startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
        }
        if (!prefix) {
            return '';
        }
    }
    // 公共前缀可能停在半截目录名上（例如 anchors 全部以 `pho` 开头），回退到目录边界
    if (prefix.endsWith('/')) {
        return prefix;
    }
    const boundary = prefix.lastIndexOf('/');
    return boundary === -1 ? '' : prefix.slice(0, boundary + 1);
};

/**
 * 按公共前缀计算本地相对路径
 * @param key OSS 对象 key
 * @param prefix 由 commonDirPrefix 计算出的公共目录前缀
 * @returns 去掉前缀的相对路径；key 不在前缀下时保留完整 key，结果为空时回退为文件名
 * @example
 * toRelativePath('a/b.jpg', 'a/') // 'b.jpg'
 * toRelativePath('photos/sub/a.jpg', '') // 'photos/sub/a.jpg'
 */
export const toRelativePath = (key: string, prefix: string): string => {
    const relative = (prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key).replace(/^\/+/, '');
    if (relative) {
        return relative;
    }
    const trimmed = key.replace(/\/+$/, '');
    const index = trimmed.lastIndexOf('/');
    return index === -1 ? trimmed : trimmed.slice(index + 1);
};

/**
 * 汇总下载进度，生成推送给渲染层的数据
 * @param items 全量进度明细
 * @param limit 明细推送上限
 * @returns 截断后的明细与汇总数据
 */
export const summarizeDownload = (
    items: DownloadProgressItem[],
    limit = DETAIL_LIMIT,
): {
    data: DownloadProgressItem[];
    truncated: boolean;
    total: number;
    finished: number;
    failed: number;
    percent: number;
} => {
    const total = items.length;
    const finished = items.filter((item) => item.finished).length;
    const failed = items.filter((item) => item.failed).length;
    const percent = total
        ? Math.round(items.reduce((sum, item) => sum + (item.finished ? 100 : item.progress), 0) / total)
        : 0;
    return {
        data: items.slice(0, limit).map((item) => ({ ...item })),
        truncated: total > limit,
        total,
        finished,
        failed,
        percent,
    };
};
