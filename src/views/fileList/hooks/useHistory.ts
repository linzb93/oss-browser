import { getHistoryList } from '@/api/history';
import { ref, shallowRef } from 'vue';
import useLogin from '@/views/login/hooks/useLogin';
import useBreadcrumb from './useBreadcrumb';
import useTable from './useTable';
export default () => {
    const pageQuery = ref({
        pageSize: 10,
        pageIndex: 1,
    });
    const visible = shallowRef(false);
    const totalCount = shallowRef(0);
    const list = ref([]);
    const { userInfo } = useLogin();
    const { breadcrumb } = useBreadcrumb();
    const { getList: getTableList } = useTable();
    return {
        list,
        totalCount,
        pageQuery,
        visible,
        async getList() {
            const result = await getHistoryList(pageQuery.value);
            totalCount.value = result.totalCount;
            list.value = result.list;
        },
        onSelect(filePath: string) {
            const { pathname } = new URL(`${userInfo.value.domain}/${filePath}`);
            breadcrumb.value = pathname.split('/').slice(1, -1);
            getTableList(false);
        },
    };
};
