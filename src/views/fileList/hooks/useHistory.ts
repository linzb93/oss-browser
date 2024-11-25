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
    const close = () => {
        visible.value = false;
    };
    return {
        /**
         * 历史记录列表
         */
        list,
        totalCount,
        /**
         * 分页参数
         */
        pageQuery,
        /**
         * 控制弹出层显示
         */
        visible,
        /**
         * 关闭弹出层的时候，将数据全部初始化。
         */
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
        /**
         * 选中某个上传记录，跳转
         * @param {string} filePath - 文件绝对路径
         */
        onSelect(filePath: string) {
            const { pathname } = new URL(`${userInfo.value.domain}/${filePath}`);
            breadcrumb.value = pathname.split('/').slice(1, -1);
            close();
            getTableList(false);
        },
        /**
         * 打开弹出层
         */
        show() {
            visible.value = true;
        },
        /**
         * 关闭弹出层
         */
        close,
    };
};
