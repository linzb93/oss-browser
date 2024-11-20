import { ref, shallowRef } from 'vue';
import useLogin from '@/views/login/hooks/useLogin';
import request from '@/helpers/request';
import useBreadcrumb from './useBreadcrumb';
import useTable from './useTable';

interface IPage {
    pageIndex: number;
    pageSize: number;
}
export interface HistoryItem {
    path: string;
}
const getHistoryList = async (query: IPage) => {
    return await request('get-history', query);
};
const visible = shallowRef(false);
const pageQuery = ref({
    pageSize: 10,
    pageIndex: 1,
});

const totalCount = shallowRef(0);
const list = ref([]);
export default () => {
    const { userInfo } = useLogin();
    const { breadcrumb } = useBreadcrumb();
    const { getList: getTableList } = useTable();
    return {
        list,
        totalCount,
        pageQuery,
        visible,
        init() {
            pageQuery.value.pageIndex = 1;
            list.value = [];
            totalCount.value = 0;
        },
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
        show() {
            visible.value = true;
        },
        close() {
            visible.value = false;
        },
    };
};
