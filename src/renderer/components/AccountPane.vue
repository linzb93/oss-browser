<template>
    <el-dialog
        v-model="visible"
        :title="isEdit ? '账号管理' : '选择账号'"
        width="800px"
        @close="handleClose"
        @closed="onClosed"
    >
        <template v-if="isEdit">
            <el-button type="primary" @click="add">添加账号</el-button>
            <el-table :data="list" class="mt10">
                <el-table-column label="名称" prop="name"></el-table-column>
                <el-table-column label="平台">
                    <template #default="scope">
                        {{ platformMap[scope.row.platform as keyof typeof platformMap] || '' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #default="scope">
                        <div class="flexalign-center">
                            <el-link type="primary" :underline="false" class="mr10" @click="edit(scope.row)"
                                >编辑</el-link
                            >
                            <el-link type="danger" :underline="false" @click="confirmDelete(scope.row)">移除</el-link>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </template>
        <el-form v-else :model="selectedAccount" ref="selectedAccountForm" label-width="120px">
            <el-select v-model="selectedAccount.id" placeholder="请选择账号">
                <el-option v-for="item in list" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
        </el-form>
        <template #footer>
            <el-button type="primary" @click="handleClose">关闭</el-button>
            <template v-if="!isEdit">
                <el-button type="primary" @click="isEdit = true">编辑账号</el-button>
                <el-button type="primary" @click="confirm">确认</el-button>
            </template>

            <el-button v-else @click="isEdit = false">退出编辑</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAccount } from '@/renderer/hooks/useAccount-v2';
import { AccountItem } from '@/shared/types';
import { getAccountList, removeAccount } from '@/renderer/api';

const visible = defineModel<boolean>({ required: true, default: false });
const emit = defineEmits(['close', 'jump']);

const { currentAccount } = useAccount();

const platformMap = {
    1: '阿里云',
};

const selectedAccount = ref<AccountItem>({} as AccountItem);

const list = ref<AccountItem[]>([]);
const getList = async () => {
    const res = await getAccountList();
    list.value = res || [];
};

const confirmDelete = (row: AccountItem) => {
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
};

const add = () => {};
const edit = (row: AccountItem) => {};

watch(
    visible,
    (val) => {
        if (val) {
            selectedAccount.value = { ...currentAccount.value };
            getList();
        }
    },
    { immediate: true },
);

const isEdit = ref(false);

const handleClose = () => {
    emit('close');
};

const confirm = () => {
    emit('jump');
};

const onClosed = () => {
    selectedAccount.value = {} as AccountItem;
    isEdit.value = false;
};
</script>
<style lang="scss" scoped>
.mt10 {
    margin-top: 10px;
}
.el-link + .el-link {
    margin-left: 10px;
}
.more-dropdown {
    position: relative;
    top: -1px;
}
</style>
