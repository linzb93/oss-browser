import { describe, expect, it } from 'vitest';
import type { DownloadProgressItem } from '@/shared/types/oss';
import { DETAIL_LIMIT, commonDirPrefix, summarizeDownload, toDirAnchor, toRelativePath } from './download';

const createItem = (data: Partial<DownloadProgressItem> = {}): DownloadProgressItem => ({
    key: 'a.jpg',
    path: 'a.jpg',
    size: 100,
    loaded: 0,
    progress: 0,
    finished: false,
    ...data,
});

describe('toDirAnchor', () => {
    it('根目录文件锚点为空串', () => {
        expect(toDirAnchor('a.jpg')).toBe('');
    });

    it('多级文件锚点为所在目录', () => {
        expect(toDirAnchor('a/b.jpg')).toBe('a/');
        expect(toDirAnchor('a/b/c.jpg')).toBe('a/b/');
    });

    it('目录选中项保留目录本身作为锚点', () => {
        expect(toDirAnchor('photos/')).toBe('photos/');
        expect(toDirAnchor('photos/sub/')).toBe('photos/sub/');
    });
});

describe('commonDirPrefix', () => {
    it('空列表返回空串', () => {
        expect(commonDirPrefix([])).toBe('');
    });

    it('同目录返回该目录', () => {
        expect(commonDirPrefix(['a/', 'a/'])).toBe('a/');
    });

    it('公共目录不跨目录边界', () => {
        expect(commonDirPrefix(['photos/', 'pho/'])).toBe('');
        expect(commonDirPrefix(['photos/a/', 'photos/b/'])).toBe('photos/');
    });

    it('根目录与其他目录的公共前缀为空', () => {
        expect(commonDirPrefix(['', 'photos/'])).toBe('');
        expect(commonDirPrefix([''])).toBe('');
    });
});

describe('toRelativePath', () => {
    it('剥离公共前缀后平铺文件名', () => {
        expect(toRelativePath('a/b.jpg', 'a/')).toBe('b.jpg');
    });

    it('无公共前缀时保留完整目录结构', () => {
        expect(toRelativePath('photos/sub/a.jpg', '')).toBe('photos/sub/a.jpg');
        expect(toRelativePath('photos/a.jpg', 'photos/')).toBe('a.jpg');
    });

    it('key 不在前缀下时保留完整 key', () => {
        expect(toRelativePath('a/b.jpg', 'c/')).toBe('a/b.jpg');
    });

    it('结果为空时回退为文件名', () => {
        expect(toRelativePath('b.jpg', 'b.jpg')).toBe('b.jpg');
        expect(toRelativePath('a/', 'a/')).toBe('a');
    });
});

describe('summarizeDownload', () => {
    it('空明细汇总为 0', () => {
        expect(summarizeDownload([])).toEqual({
            data: [],
            truncated: false,
            total: 0,
            finished: 0,
            failed: 0,
            percent: 0,
        });
    });

    it('百分比按每个文件的完成度取平均，已结束文件计 100', () => {
        const result = summarizeDownload([
            createItem({ progress: 50 }),
            createItem({ progress: 100, finished: true }),
        ]);
        expect(result.percent).toBe(75);
        expect(result.finished).toBe(1);
        expect(result.failed).toBe(0);
    });

    it('失败文件计入 finished 与 failed', () => {
        const result = summarizeDownload([
            createItem({ finished: true, failed: true, progress: 30 }),
            createItem({ finished: true, progress: 100 }),
        ]);
        expect(result.percent).toBe(100);
        expect(result.finished).toBe(2);
        expect(result.failed).toBe(1);
    });

    it('明细超过上限时截断并标记', () => {
        const items = Array.from({ length: DETAIL_LIMIT + 1 }, (_, index) => createItem({ key: `${index}.jpg` }));
        const result = summarizeDownload(items);
        expect(result.data).toHaveLength(DETAIL_LIMIT);
        expect(result.total).toBe(DETAIL_LIMIT + 1);
        expect(result.truncated).toBe(true);
    });

    it('返回的明细是副本，不影响源数据', () => {
        const item = createItem();
        const result = summarizeDownload([item]);
        result.data[0].progress = 66;
        expect(item.progress).toBe(0);
    });
});
