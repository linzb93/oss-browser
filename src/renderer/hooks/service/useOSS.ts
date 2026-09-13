import { ref, h } from 'vue';
import { sleep } from '@linzb93/utils';
import type { TableItem, ExtraTableItem } from '@/shared/types';
import MsgBoxFileList from '@/renderer/components/FileList.vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { requestActions, request } from '@/renderer/utils/request';
import { getOSSList as apiGetOSSList, addDirectory, deleteItem as deleteItemApi, copyTemplate } from '@/renderer/api';
import { useBreadcrumb } from '../common/useBreadcrumb';
import { scrollTo } from '@/renderer/utils/scroll-to';
import { getSize } from '@/renderer/utils/size';

const { fullPath } = useBreadcrumb();
export type BatchCommandKey = 'download' | 'delete' | 'copy';
/** 每页条数可选档位 */
const PAGE_SIZES = [20, 40, 80, 100];
/** 每页条数默认值，与后端 max-keys 默认对齐 */
const DEFAULT_PAGE_SIZE = 40;
const ossList = ref<TableItem[]>([]);
/** 是否有下一页 */
const hasNext = ref(false);
/** 是否有上一页 */
const hasPrev = ref(false);
/** 当前页码，从 1 开始 */
const currentPage = ref(1);
/** 每页条数 */
const pageSize = ref(DEFAULT_PAGE_SIZE);
/** 分页尺寸档位 */
const pageSizes = PAGE_SIZES;
const loading = ref(true);

const toTableItem = (item: { name: string; type: string; size: number; lastModified?: string | number }) => {
    const path = `${fullPath.value}${item.name}${item.type === 'dir' ? '/' : ''}`;
    return {
        ...item,
        path,
        sizeFormat: getSize(item),
    };
};

/**
 * 加载文件列表
 * @param {('reset' | 'next' | 'prev')} direction - 翻页方向：
 *   - reset: 重新加载（切换目录、刷新等场景）
 *   - next : 进入下一页
 *   - prev : 返回上一页
 */
const getOSSList = async (direction: 'reset' | 'next' | 'prev' = 'reset') => {
    loading.value = true;
    try {
        const data = await apiGetOSSList({
            prefix: fullPath.value,
            pageSize: pageSize.value,
            direction,
        });
        const list = data.list.map(toTableItem);
        ossList.value = list;
        currentPage.value = data.page;
        hasNext.value = data.hasNext;
        hasPrev.value = data.hasPrev;
        request('oss:set-current-path', { path: fullPath.value });
    } catch (error) {
        ElMessage.error('接口故障，请稍后再试');
    } finally {
        loading.value = false;
    }
};

/**
 * 切换每页条数，自动重置到首页。
 * @param {number} size - 新的每页条数
 */
const setPageSize = async (size: number) => {
    pageSize.value = size;
    scrollTo(0, 800, '.other-wrap');
    await getOSSList('reset');
};

/**
 * 执行批量命令
 * @param {BatchCommandKey} command - 命令键
 * @param {ExtraTableItem[]} selected - 选中的文件列表
 */
export const batchCommand = (command: BatchCommandKey, selected: ExtraTableItem[]) => {
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
const checkMultiSelect = (selected: ExtraTableItem[]): boolean => {
    if (selected.length) {
        return true;
    }
    ElMessage.error('请选择至少一个');
    return false;
};
const batchCopy = (selected: ExtraTableItem[]) => {
    if (!checkMultiSelect(selected)) {
        return;
    }
    requestActions.copy(selected.map((item) => item.url).join('\n'));
};
/**
 * 批量删除
 */
const batchDelete = (selected: ExtraTableItem[]) => {
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
        getOSSList('reset');
    });
};
/**
 * 批量下载文件
 */
const batchDownload = async (selected: ExtraTableItem[]) => {
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
        paths: `${fullPath.value}${name}`,
    });
    ElMessage.success('删除成功');
    getOSSList('reset');
}
/**
 * 复制文件（记录到剪贴板，供右键粘贴使用）
 * @param {TableItem} item - 列表项
 */
export const copyFile = async (item: TableItem) => {
    await request('oss:copy', {
        name: item.name,
        path: item.path,
    });
    ElMessage.success('文件等待复制');
};
/**
 * 创建目录
 */
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
            getOSSList('reset');
        })
        .catch(() => {
            //
        });
};
/**
 * 获取图片样式并复制模板
 * @param {TableItem} item - 列表项
 */
export const getStyle = (item: TableItem, prefix: string) => {
    const img = new Image();
    img.src = `${prefix}/${item.path}`;
    img.onload = function () {
        const { width, height } = img;
        copyTemplate({
            width,
            height,
            url: img.src,
        })
            .then(() => {
                ElMessage.success('复制成功');
            })
            .catch((e) => {
                ElMessage.error(e.message);
            });
    };
};
const tableLoading = ref(false);
const setTableLoading = async () => {
    tableLoading.value = true;
    await sleep(800);
    tableLoading.value = false;
};
export const useOSSStore = () => {
    return {
        ossList,
        getOSSList,
        setPageSize,
        fullPath,
        tableLoading,
        setTableLoading,
        currentPage,
        pageSize,
        pageSizes,
        hasNext,
        hasPrev,
        loading,
    };
};
