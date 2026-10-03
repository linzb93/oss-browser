import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ElMessage } from 'element-plus';
import type { DownloadProgressPayload } from '@/shared/types';
import { downloadTargets, useDownload } from './useDownload';

vi.mock('element-plus', () => ({
    ElMessage: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
}));

const createPayload = (data: Partial<DownloadProgressPayload> = {}): DownloadProgressPayload => ({
    type: 'downloading',
    data: [],
    truncated: false,
    savedPath: '',
    total: 0,
    finished: 0,
    failed: 0,
    percent: 0,
    ...data,
});

const { downloading, downloadFinished, downloadingList, downloadSavedPath, downloadSummary, applyDownloadProgress } =
    useDownload();

const invoke = vi.fn().mockResolvedValue({ code: 200, result: null });

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', { ipcRenderer: { invoke } });
    downloading.value = false;
    downloadFinished.value = false;
    downloadingList.value = [];
    downloadSavedPath.value = '';
    downloadSummary.value = { total: 0, finished: 0, failed: 0, percent: 0, truncated: false };
});

describe('applyDownloadProgress', () => {
    it('下载中：更新明细、汇总与保存目录', () => {
        applyDownloadProgress(
            createPayload({
                type: 'downloading',
                data: [{ key: 'a/b.jpg', path: 'b.jpg', size: 100, loaded: 50, progress: 50, finished: false }],
                savedPath: '/tmp/oss',
                total: 1,
                finished: 0,
                failed: 0,
                percent: 50,
            }),
        );
        expect(downloading.value).toBe(true);
        expect(downloadSavedPath.value).toBe('/tmp/oss');
        expect(downloadingList.value).toHaveLength(1);
        expect(downloadSummary.value.percent).toBe(50);
        expect(ElMessage.success).not.toHaveBeenCalled();
    });

    it('下载完成：复位状态并提示成功', () => {
        applyDownloadProgress(
            createPayload({
                type: 'download-finished',
                data: [{ key: 'a.jpg', path: 'a.jpg', size: 10, loaded: 10, progress: 100, finished: true }],
                savedPath: '/tmp/oss',
                total: 1,
                finished: 1,
                percent: 100,
            }),
        );
        expect(downloading.value).toBe(false);
        expect(downloadFinished.value).toBe(true);
        expect(ElMessage.success).toHaveBeenCalledWith('下载成功');
    });

    it('下载完成但有失败：提示失败数量', () => {
        applyDownloadProgress(
            createPayload({
                type: 'download-finished',
                data: [{ key: 'a.jpg', path: 'a.jpg', size: 10, loaded: 3, progress: 30, finished: true, failed: true }],
                total: 1,
                finished: 1,
                failed: 1,
                percent: 100,
            }),
        );
        expect(downloading.value).toBe(false);
        expect(ElMessage.error).toHaveBeenCalledWith('下载完成，1 个文件失败');
        expect(ElMessage.success).not.toHaveBeenCalled();
    });

    it('空目录：提示没有可下载的文件', () => {
        applyDownloadProgress(createPayload({ type: 'download-finished' }));
        expect(downloading.value).toBe(false);
        expect(downloadFinished.value).toBe(true);
        expect(ElMessage.warning).toHaveBeenCalledWith('没有可下载的文件');
    });

    it('取消选择保存目录：复位并提示', () => {
        downloading.value = true;
        downloadingList.value = [{ key: 'a.jpg', path: 'a.jpg', size: 1, loaded: 0, progress: 0, finished: false }];
        applyDownloadProgress(createPayload({ type: 'download-canceled' }));
        expect(downloading.value).toBe(false);
        expect(downloadingList.value).toHaveLength(0);
        expect(ElMessage.info).toHaveBeenCalledWith('已取消下载');
    });
});

describe('downloadTargets', () => {
    it('提示未选择文件且不发起请求', async () => {
        await downloadTargets([]);
        expect(ElMessage.error).toHaveBeenCalledWith('请选择至少一个');
        expect(invoke).not.toHaveBeenCalled();
    });

    it('已有下载任务进行中时不再重复触发', async () => {
        downloading.value = true;
        await downloadTargets('a.jpg');
        expect(ElMessage.warning).toHaveBeenCalledWith('已有下载任务进行中，请稍后再试');
        expect(invoke).not.toHaveBeenCalled();
    });

    it('把对象 key 拼成逗号分隔的 paths 发起 IPC 请求', async () => {
        await downloadTargets(['photos/a.jpg', 'photos/b.jpg']);
        expect(invoke).toHaveBeenCalledWith('oss:download', JSON.stringify({ paths: 'photos/a.jpg,photos/b.jpg' }));
        expect(downloading.value).toBe(true);
    });

    it('IPC 失败时复位下载状态并提示', async () => {
        invoke.mockResolvedValueOnce({ code: 500, result: null, message: 'Account not found' });
        await downloadTargets('a.jpg');
        expect(downloading.value).toBe(false);
        expect(ElMessage.error).toHaveBeenCalledWith('Account not found');
    });
});
