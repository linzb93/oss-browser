import { ref, shallowRef, h, computed } from 'vue';
import { scrollTo } from '@/renderer/helpers/scroll-to';
import { requestUtil } from '@/renderer/helpers/request';
import { handleMainPost } from '@/renderer/helpers/util';
import { ElMessage, ElMessageBox } from 'element-plus';
import useBreadcrumb from '@/renderer/hooks/useBreadcrumb';
import { type TableItem } from '@/renderer/types';
import MsgBoxFileList from '@/renderer/components/FileList.vue';
import useLogin from '@/renderer/hooks/useLogin';
import * as api from '@/renderer/api';
import { getSize } from '@/renderer/helpers/size';

const tableList = ref<TableItem[]>([]);
const finished = shallowRef(false);
const loading = shallowRef(true);
const disabled = computed(() => loading.value || finished.value);
const selected = ref<TableItem[]>([]);
const activeIndex = shallowRef(-1);
let eventBinded = false;
/**
 * Hook for table operations
 * @returns {object} The hook object
 */

export default () => {
    const { fullPath } = useBreadcrumb();
    const { userInfo } = useLogin();

    /**
     * Get file list
     * @param {boolean} isConcat - Whether to concatenate the list
     * @returns {Promise<void>}
     */
    async function getList(isConcat: boolean) {
        loading.value = true;
        if (!isConcat) {
            finished.value = false;
            scrollTo(0, 800, '.other-wrap');
        }
        try {
            const data = await api.getList({
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
                    url: `${userInfo.value.domain}/${path}`,
                };
            });
            tableList.value = isConcat ? tableList.value.concat(list) : list;
            finished.value = !data.token;
        } catch (error) {
            loading.value = false;
            finished.value = true;
            ElMessage.error('接口故障，请稍后再试');
        }
    }
    /**
     * Check if multiple items are selected
     * @returns {boolean} True if multiple items are selected
     */
    const checkMultiSelect = () => {
        if (selected.value.length) {
            return true;
        }
        ElMessage.error('请选择至少一个');
        return false;
    };
    /**
     * Get active item
     * @returns {TableItem} The active item
     */
    const getActiveItem = () => {
        return tableList.value[activeIndex.value];
    };
    /**
     * Create a new directory
     */
    const createDir = () => {
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
                if (tableList.value.some((file) => file.type === 'dir' && file.name === value)) {
                    ElMessage.warning('存在同名目录，无需创建');
                    return;
                }
                await api.addDirectory({
                    prefix: fullPath.value,
                    names: value,
                    type: 'directory',
                });
                ElMessage.success('创建成功');
                getList(false);
            })
            .catch(() => {
                //
            });
    };

    return {
        /**
         * 文件列表
         */
        tableList,
        /**
         * 能否继续加载下一页，在加载下一页的过程中会置为true，加载完成后置为false
         */
        disabled,
        /**
         * 获取文件列表
         * @param {boolean} isConcat - Whether to concatenate the list
         * @returns {Promise<void>}
         */
        getList,
        selected,
        activeIndex,
        /**
         * Initialize the hook
         */
        init() {
            if (eventBinded) {
                return;
            }
            eventBinded = true;
            console.log(`初始化事件绑定: ${eventBinded}`);
            handleMainPost('create-dir', () => {
                createDir();
            });
            handleMainPost('reload', () => {
                getList(false);
            });
            handleMainPost('copy-url', () => {
                const item = getActiveItem();
                console.log(item);
                if (item) {
                    requestUtil.copy(item.url);
                }
            });
            handleMainPost('location', (data: { isDown: boolean }) => {
                const { isDown } = data;
                if (isDown) {
                    if (activeIndex.value < tableList.value.length - 1) {
                        activeIndex.value += 1;
                    }
                } else {
                    if (activeIndex.value > 0) {
                        activeIndex.value -= 1;
                    } else {
                        activeIndex.value = 0;
                    }
                }
                if (activeIndex.value > 5) {
                    const rowHeight = (document.querySelector('.el-table__row') as HTMLElement).clientHeight;
                    (document.querySelector('.other-wrap') as HTMLElement).scrollTop =
                        (activeIndex.value - 4) * rowHeight - 2;
                }
            });
        },
        /**
         * 多选项发生改变时触发的方法。目前不操作目录
         * @param {TableItem[]} selection - 已选中项
         */
        handleSelectionChange: (selection: TableItem[]) => {
            selected.value = selection.filter((item) => item.type !== 'dir');
        },
        /**
         * 批量下载文件
         */
        async batchDownload() {
            if (!checkMultiSelect()) {
                return;
            }
            await requestUtil.download(selected.value.map((item) => item.url).join(','));
            selected.value = [];
        },
        /**
         * 删除某个文件
         * @param {TableItem} item - 列表项
         */
        async doDelete(item: TableItem) {
            const name = `${item.name}${item.type === 'dir' ? '/' : ''}`;
            await api.deleteItem({
                paths: `${fullPath.value}${name}`,
            });
            ElMessage.success('删除成功');
            getList(false);
        },
        /**
         * 批量删除
         */
        batchDelete() {
            if (!checkMultiSelect()) {
                return;
            }
            ElMessageBox({
                message: h(MsgBoxFileList, {
                    list: selected.value.map((item) => ({ name: item.name })),
                    tips: '确认删除以下文件：',
                }),
                title: '温馨提醒',
                showCancelButton: true,
                confirmButtonText: '删除',
                cancelButtonText: '取消',
            }).then(async () => {
                await api.deleteItem({
                    paths: selected.value.map((item) => `${fullPath.value}${item.name}`).join(','),
                });
                ElMessage.success('删除成功');
                selected.value = [];
                getList(false);
            });
        },
        /**
         * 创建目录
         */
        createDir,
        /**
         * 批量复制文件地址，用换行符区分
         */
        batchCopy() {
            if (!checkMultiSelect()) {
                return;
            }
            requestUtil.copy(selected.value.map((item) => item.url).join('\n'));
        },
        /**
         * 获取某个位置的文件
         * @returns {TableItem} The active item
         */
        getActiveItem,
        /**
         * Reset active index
         */
        resetActiveIndex() {
            activeIndex.value = -1;
        },
    };
};
