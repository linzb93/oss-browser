import { ref } from 'vue';
import { omit } from 'lodash-es';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAccountList, removeAccount } from '@/renderer/api';
import useLogin from './useLogin';

export default () => {
    const { visible: addDialogVisible, form } = useLogin();

    const list = ref<any[]>([]);

    const getList = async () => {
        const data = await getAccountList();
        list.value = data;
    };

    const add = () => {
        addDialogVisible.value = true;
    };

    const edit = (item: any) => {
        form.value = item;
        addDialogVisible.value = true;
    };

    const jump = (item: any) => {
        // handled by parent component
    };

    const handleCommand = (row: any, cmd: string) => {
        if (cmd === 'copy') {
            edit(omit(row, ['id']));
            return;
        }
        if (cmd === 'delete') {
        }
    };

    return {
        list,
        getList,
        add,
        edit,
        jump,
        handleCommand,
        addDialogVisible,
    };
};
