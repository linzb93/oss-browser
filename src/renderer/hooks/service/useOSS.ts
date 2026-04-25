import { ref, computed, h } from 'vue';
import type { TableItem } from '@/shared/types';
import MsgBoxFileList from '@/renderer/components/MsgBoxFileList.vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { requestActions } from '@/renderer/utils/request';
import { getOSSList as apiGetOSSList, addDirectory, deleteItem as deleteItemApi, copyTemplate } from '@/renderer/api';
import { isPic } from '@/renderer/utils/picture';
import { useBreadcrumb } from './useBreadcrumb';
import { usePreview } from './usePreview';
import { useGlobalConfigStore } from '../common/useGlobalConfig';
import { scrollTo } from '@/renderer/utils/scroll-to';
const { breadcrumb, fullPath, push: pushBreadcrumb } = useBreadcrumb();
const { openPreview } = usePreview();
import { getSize } from '@/renderer/utils/size';

const { currentAccount } = useGlobalConfigStore();
export type BatchCommandKey = 'download' | 'delete' | 'copy';
const ossList = ref<TableItem[]>([]);
const finished = ref(false);
const loading = ref(true);
const disabled = computed(() => loading.value || finished.value);

const getOSSList = async (isConcat: boolean = true) => {
    loading.value = true;
    if (!isConcat) {
        finished.value = false;
        scrollTo(0, 800, '.other-wrap');
    }
    try {
        const data = await apiGetOSSList({
            prefix: fullPath.value,
            useToken: isConcat,
        });
        loading.value = false;
        const list = data.list.map((item) => {
            const path = `${fullPath.value}${item.name}${item.type === 'dir' ? '/' : ''}`;
            return {
                ...item,
                path,
                sizeFormat: getSize(item),
                url: `${currentAccount.value.domain}/${path}`,
            };
        });
        ossList.value = isConcat ? ossList.value.concat(list) : list;
        finished.value = !data.token;
    } catch (error) {
        loading.value = false;
        finished.value = true;
        ElMessage.error('接口故障，请稍后再试');
    }
};

/**
 * 执行批量命令
 * @param {BatchCommandKey} command - 命令键
 * @param {TableItem[]} selected - 选中的文件列表
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
 * 检查是否选择了多个文件
 * @returns {boolean} 如果选择了多个文件则返回 true
 */
const checkMultiSelect = (selected: TableItem[]): boolean => {
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
        await deleteItemApi({
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

/**
 * 删除某个文件
 * @param {TableItem} item - 列表项
 */
export async function deleteItem(item: TableItem) {
    const name = `${item.name}${item.type === 'directory' ? '/' : ''}`;
    await deleteItemApi({
        paths: `${fullPath}${name}`,
    });
    ElMessage.success('删除成功');
    getOSSList(false);
}
export const createDirectory = () => {
    ElMessageBox.prompt('请输入目录名称', '温馨提醒', {
        confirmButtonText: '创建',
        beforeClose: (action, instance, done) => {
            if (action !== 'confirm') {
                done();
                return;
            }
            if (!instance.inputValue) {
                ElMessage.error('请输入目录名称');
                return;
            }
            done();
        },
    })
        .then(async ({ value }) => {
            if (ossList.value.some((file) => file.type === 'directory' && file.name === value)) {
                ElMessage.warning('存在同名目录，无需创建');
                return;
            }
            await addDirectory({
                prefix: fullPath.value,
                names: value,
                type: 'directory',
            });
            ElMessage.success('创建成功');
            getOSSList(false);
        })
        .catch(() => {
            //
        });
};
/**
 * 获取图片样式并复制模板
 * @param {TableItem} item - 列表项
 */
export const getStyle = (item: TableItem) => {
    const img = new Image();
    img.src = item.url;
    img.onload = function () {
        const { width, height } = img;
        copyTemplate({
            width,
            height,
            url: item.url,
        })
            .then(() => {
                ElMessage.success('复制成功');
            })
            .catch((e) => {
                ElMessage.error(e.message);
            });
    };
};
/**
 * 处理路径点击事件
 * @param {TableItem} item - 列表项
 */
export const clickPath = (item: TableItem) => {
    if (item.size > 0) {
        const url = item.url;
        // 是图片
        if (isPic(item)) {
            openPreview(item.url);
            return;
        }
        return;
    }
    pushBreadcrumb(item.name);
};

export const useOSSStore = () => {
    return { ossList, getOSSList, fullPath, breadcrumb, disabled };
};
