/**
 * 列表相关的变量与方法。
 */
import { ref, shallowRef, computed } from 'vue';
import { scrollTo } from '@/helpers/scroll-to';
import { getTableList } from '@/api/table';
import { ElMessage } from 'element-plus';
import useBreadcrumb from './useBreadcrumb';
import { type TableItem } from '../shared/types';

const tableList = ref<TableItem[]>([]);
export default () => {
    const finished = shallowRef(false);
    const disabled = computed(() => loading.value || finished.value);
    const loading = shallowRef(true);
    const { fullPath } = useBreadcrumb();
    return {
        tableList,
        disabled,
        async getList(isConcat: boolean) {
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
        },
    };
};
