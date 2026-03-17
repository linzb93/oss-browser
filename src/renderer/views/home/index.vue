<template>
    <div v-if="loaded">
        <template v-if="list.length">
            <el-button type="primary" @click="add">添加账号</el-button>
            <el-table :data="list">
                <el-table-column label="ID" prop="id"></el-table-column>
                <el-table-column label="名称" prop="name"></el-table-column>
                <el-table-column label="平台">
                    <template #default="scope">
                        {{ getPlatformName(scope.row.platform) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #default="scope">
                        <div class="flexalign-center">
                            <el-link type="primary" :underline="false" @click="jump(scope.row)">进入</el-link>
                            <el-link type="primary" :underline="false" class="mr10" @click="edit(scope.row)"
                                >编辑</el-link
                            >
                            <el-link type="primary" :underline="false" @click="handleCommand(scope.row, 'copy')"
                                >复制</el-link
                            >
                            <el-link type="danger" :underline="false" @click="handleCommand(scope.row, 'delete')"
                                >移除</el-link
                            >
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </template>
        <div class="flex-center full-height" v-else>
            <el-empty>
                <template #description>
                    <span></span>
                </template>
                <el-button type="primary" @click="add">添加您的第一个账号</el-button>
            </el-empty>
        </div>
    </div>
    <add-dialog @submit="getList" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { omit } from 'lodash-es';
import { ElMessage, ElMessageBox } from 'element-plus';

import request from '@/renderer/helpers/request';
import AddDialog from './components/AddDialog.vue';
import useLogin from './hooks/useLogin';
const router = useRouter();
const { visible, form } = useLogin();

const list = ref([]);
const loaded = ref(false);
/**
 * 获取账号列表
 * @returns {Promise<void>}
 */
const getList = async () => {
    const data = await request('account:get-list');
    list.value = data;
};
onMounted(async () => {
    const id = await request('account:get-default-app-id');
    loaded.value = true;
    if (!id) {
        await getList();
        return;
    }
    await request('account:set-default-app-id', { id });
    router.push({
        path: '/fileList',
        query: {
            id,
        },
    });
});

/**
 * 显示添加账号弹窗
 */
const add = () => {
    visible.value = true;
};
/**
 * 编辑账号
 * @param {object} item - 账号信息
 */
const edit = (item) => {
    form.value = item;
    visible.value = true;
};

/**
 * 获取平台名称
 * @param {number} type - 平台类型
 * @returns {string} 平台名称
 */
const getPlatformName = (type) => {
    if (type === 1) {
        return '阿里云';
    }
    return '';
};
/**
 * 跳转到文件列表
 * @param {object} item - 账号信息
 * @returns {Promise<void>}
 */
const jump = async (item) => {
    await request('account:set-default-app-id', { id: item.id });
    router.push({
        path: '/fileList/',
        query: {
            id: item.id,
        },
    });
};

/**
 * 处理操作命令
 * @param {object} row - 行数据
 * @param {string} cmd - 命令类型
 */
const handleCommand = (row, cmd) => {
    if (cmd === 'copy') {
        edit(omit(row, ['id']));
        return;
    }
    if (cmd === 'delete') {
        ElMessageBox.confirm(`确认删除账号【${row.name}】？`, '温馨提醒', {
            confirmButtonText: '删除',
        })
            .then(async () => {
                await request('account:remove', {
                    id: row.id,
                });
                ElMessage.success('移除成功');
                getList();
            })
            .catch(() => {
                //
            });
    }
};
</script>
<style lang="scss" scoped>
.el-link + .el-link {
    margin-left: 10px;
}
</style>
