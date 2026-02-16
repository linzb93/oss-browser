import { ref, shallowRef } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import useLogin from '@/views/home/hooks/useLogin';
import useBreadcrumb from './useBreadcrumb';
import useTable from './useTable';
import * as api from '../api';
import { IHistoryItem } from '../shared/types';

const visible = shallowRef(false);
const pageQuery = ref({
    pageSize: 10,
    pageIndex: 1,
});

const totalCount = shallowRef(0);
const list = ref<IHistoryItem[]>([]);
const selectedIds = ref<string[]>([]);

export default () => {
    const { userInfo } = useLogin();
    const { breadcrumb } = useBreadcrumb();
    const { getList: getTableList } = useTable();
    const getList = async () => {
        const result = await api.getHistoryList(pageQuery.value);
        totalCount.value = result.totalCount;
        list.value = result.list;
    };
    const close = () => {
        visible.value = false;
        selectedIds.value = [];
    };
    const handleSelectionChange = (rows: IHistoryItem[]) => {
        selectedIds.value = rows.map((row) => row.id);
    };
    const deleteHistory = async () => {
        if (!selectedIds.value.length) return;
        await ElMessageBox.confirm('确定删除选中的历史记录吗？', '提示', {
            type: 'warning',
        });
        await api.removeHistory(selectedIds.value);
        ElMessage.success('删除成功');
        selectedIds.value = [];
        getList();
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
            selectedIds.value = [];
            getList();
        },
        getList,
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
        selectedIds,
        handleSelectionChange,
        deleteHistory,
    };
};
