import { h } from 'vue';
import { requestActions } from '@/renderer/utils/request';
import MsgBoxFileList from '@/renderer/components/MsgBoxFileList.vue';
import { deleteItem } from '@/renderer/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { TableItem } from '@/shared/types';
import { useOSSStore } from '@/renderer/store/useOSS';

const { fullPath, getOSSList } = useOSSStore();

export type BatchCommandKey = 'download' | 'delete' | 'copy';
/**
 * Handle batch commands
 * @param {BatchCommandKey} command - The command to execute
 */
export const batchCommand = (command: BatchCommandKey, selected: TableItem[]) => {
    const actions = {
        download: batchDownload,
        delete: batchDelete,
        copy: batchCopy,
    };
    if (actions[command]) {
        actions[command](selected);
    }
};

/**
 * Check if multiple items are selected
 * @returns {boolean} True if multiple items are selected
 */
const checkMultiSelect = (selected: TableItem[]) => {
    if (selected.length) {
        return true;
    }
    ElMessage.error('请选择至少一个');
    return false;
};
const batchCopy = (selected: TableItem[]) => {
    if (!checkMultiSelect(selected)) {
        return;
    }
    requestActions.copy(selected.map((item) => item.url).join('\n'));
};
/**
 * 批量删除
 */
const batchDelete = (selected: TableItem[]) => {
    if (!checkMultiSelect(selected)) {
        return;
    }
    ElMessageBox({
        message: h(MsgBoxFileList, {
            list: selected.map((item) => ({ name: item.name })),
            tips: '确认删除以下文件：',
        }),
        title: '温馨提醒',
        showCancelButton: true,
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    }).then(async () => {
        await deleteItem({
            paths: selected.map((item) => `${fullPath}${item.name}`).join(','),
        });
        ElMessage.success('删除成功');
        getOSSList(false);
    });
};
/**
 * 批量下载文件
 */
const batchDownload = async (selected: TableItem[]) => {
    if (!checkMultiSelect(selected)) {
        return;
    }
    await requestActions.download(selected.map((item) => item.url).join(','));
};
