import { ref, shallowRef, h, computed } from 'vue';
import { scrollTo } from '@/helpers/scroll-to';
import request, { requestUtil } from '@/helpers/request';
import { handleMainPost } from '@/helpers/util';
import { ElMessage, ElMessageBox } from 'element-plus';
import useBreadcrumb from './useBreadcrumb';
import { type TableItem } from '../shared/types';
import MsgBoxFileList from '../components/FileList.vue';
interface ListParams {
    prefix: string;
    useToken: boolean;
}

const getTableList = async (params: ListParams) => {
    return await request('oss-get-list', params);
};
interface AddParams {
    prefix: string;
    name: string;
    type: 'directory' | 'files';
}
const addPath = async (params: AddParams) => {
    await request('oss-add-path', params);
};

const deleteItem = async (data: { path: string }) => {
    await request('oss-delete', data);
};

const tableList = ref<TableItem[]>([]);
const finished = shallowRef(false);
const loading = shallowRef(true);
const disabled = computed(() => loading.value || finished.value);
const selected = ref<TableItem[]>([]);
export default () => {
    const { fullPath } = useBreadcrumb();

    async function getList(isConcat: boolean) {
        loading.value = true;
        if (!isConcat) {
            finished.value = false;
            scrollTo(0, 800, '.other-wrap');
        }
        try {
            const data = await getTableList({
                prefix: fullPath.value,
                useToken: isConcat,
            });
            loading.value = false;
            if (isConcat) {
                tableList.value = tableList.value.concat(data.list);
            } else {
                tableList.value = data.list;
            }
            finished.value = !data.token;
        } catch (error) {
            loading.value = false;
            finished.value = true;
            ElMessage.error('接口故障，请稍后再试');
        }
    }
    const checkMultiSelect = () => {
        if (selected.value.length) {
            return true;
        }
        ElMessage.error('请选择至少一个');
        return false;
    };
    const createDir = () => {
        ElMessageBox.prompt('请输入文件夹名称', '温馨提醒', {
            confirmButtonText: '创建',
            beforeClose: (action, instance, done) => {
                if (action !== 'confirm') {
                    done();
                    return;
                }
                if (!instance.inputValue) {
                    ElMessage.error('请输入文件夹名称');
                    return;
                }
                done();
            },
        })
            .then(async ({ value }) => {
                if (tableList.value.some((file) => file.type === 'dir' && file.name === value)) {
                    ElMessage.warning('存在同名文件夹，无需创建');
                    return;
                }
                await addPath({
                    prefix: fullPath.value,
                    name: value,
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
        getList,
        init() {
            handleMainPost('create-dir', () => {
                createDir();
            });
            handleMainPost('reload', () => {
                getList(false);
            });
        },
        /**
         * 多选项发生改变时触发的方法
         * @param {TableItem[]} selection - 已选中项
         */
        handleSelectionChange: (selection: TableItem[]) => {
            selected.value = selection.filter((item) => item.type !== 'dir');
        },
        /**
         * 下载单一文件
         */
        download() {},
        /**
         * 批量下载文件
         * @returns
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
        async del(item: TableItem) {
            const name = item.type === 'dir' ? `${item.name}/` : item.name;
            await deleteItem({
                path: `${fullPath.value}${name}`,
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
                    list: selected.value.map((item) => item.name),
                    tips: '确认删除以下文件：',
                }),
                title: '温馨提醒',
                showCancelButton: true,
                confirmButtonText: '删除',
                cancelButtonText: '取消',
            }).then(async () => {
                await request('oss-delete', {
                    path: selected.value.map((item) => `${fullPath.value}${item.name}`).join(','),
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
    };
};
