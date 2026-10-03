import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { request } from '@/renderer/utils/request';
import type { DownloadProgressItem, DownloadProgressPayload } from '@/shared/types';

/**
 * 下载状态（单文件、目录、批量下载共用）
 */
const downloading = ref(false);
/** 本轮下载是否已结束 */
const downloadFinished = ref(false);
/** 下载进度明细（由主进程截断为前 200 条） */
const downloadingList = ref<DownloadProgressItem[]>([]);
/** 用户选择的本地保存目录 */
const downloadSavedPath = ref('');
/** 本轮下载的汇总数据 */
const downloadSummary = ref({
    total: 0,
    finished: 0,
    failed: 0,
    percent: 0,
    truncated: false,
});

/**
 * 触发下载：单文件、目录、批量下载都走这里
 * @param targets oss 对象 key，目录以 / 结尾
 */
export const downloadTargets = async (targets: string | string[]) => {
    if (downloading.value) {
        ElMessage.warning('已有下载任务进行中，请稍后再试');
        return;
    }
    const keys = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
    if (!keys.length) {
        ElMessage.error('请选择至少一个');
        return;
    }
    downloadingList.value = [];
    downloadSummary.value = { total: 0, finished: 0, failed: 0, percent: 0, truncated: false };
    downloadSavedPath.value = '';
    downloadFinished.value = false;
    downloading.value = true;
    try {
        await request('oss:download', {
            paths: keys.join(','),
        });
    } catch (error) {
        // 主进程异常（如账号不存在）时不会有进度消息，需要在这里复位
        downloading.value = false;
        ElMessage.error((error as { message?: string } | null)?.message || '下载失败');
    }
};

/**
 * 应用主进程推送的下载进度
 * @param payload 进度消息
 */
export const applyDownloadProgress = (payload: DownloadProgressPayload) => {
    const { type, data, savedPath, total, finished, failed, percent, truncated } = payload;
    if (type === 'download-canceled') {
        downloading.value = false;
        downloadingList.value = [];
        downloadSummary.value = { total: 0, finished: 0, failed: 0, percent: 0, truncated: false };
        downloadSavedPath.value = '';
        ElMessage.info('已取消下载');
        return;
    }
    downloadingList.value = data;
    downloadSummary.value = { total, finished, failed, percent, truncated };
    if (savedPath) {
        downloadSavedPath.value = savedPath;
    }
    if (type === 'downloading') {
        downloading.value = true;
        return;
    }
    // download-finished
    downloading.value = false;
    downloadFinished.value = true;
    if (!total) {
        ElMessage.warning('没有可下载的文件');
        return;
    }
    if (failed) {
        ElMessage.error(`下载完成，${failed} 个文件失败`);
        return;
    }
    ElMessage.success('下载成功');
};

export const useDownload = () => {
    return {
        downloading,
        downloadFinished,
        downloadingList,
        downloadSavedPath,
        downloadSummary,
        downloadTargets,
        applyDownloadProgress,
    };
};
