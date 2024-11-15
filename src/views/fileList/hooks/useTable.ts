/**
 * 列表相关的变量与方法。
 */
import { ref, shallowRef, computed } from 'vue';
import { scrollTo } from '@/helpers/scroll-to';
import { getTableList, deleteItem, addPath } from '@/api/table';
import { ElMessage, ElMessageBox } from 'element-plus';
import useBreadcrumb from './useBreadcrumb';
import { type TableItem } from '../shared/types';

const tableList = ref<TableItem[]>([]);
export default () => {
    const finished = shallowRef(false);
    const disabled = computed(() => loading.value || finished.value);
    const loading = shallowRef(true);
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
    return {
        tableList,
        disabled,
        getList,
        async del(item: TableItem) {
            const name = item.type === 'dir' ? `${item.name}/` : item.name;
            await deleteItem({
                path: `${fullPath.value}${name}`,
            });
            ElMessage.success('删除成功');
            getList(false);
        },
        createDir() {
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
        },
    };
};
