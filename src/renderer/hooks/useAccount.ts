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

    const getPlatformName = (type: number) => {
        if (type === 1) {
            return '阿里云';
        }
        return '';
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
            ElMessageBox.confirm(`确认删除账号【${row.name}】？`, '温馨提醒', {
                confirmButtonText: '删除',
            })
                .then(async () => {
                    await removeAccount({ id: row.id });
                    ElMessage.success('移除成功');
                    getList();
                })
                .catch(() => {
                    //
                });
        }
    };

    return {
        list,
        getList,
        add,
        edit,
        getPlatformName,
        jump,
        handleCommand,
        addDialogVisible,
    };
};
