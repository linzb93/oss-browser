<template>
    <el-drawer :size="800" v-model="visible" title="历史记录" @close="close" @closed="onClosed">
        <div class="mb20">
            <el-button type="danger" :disabled="!selectedIds.length" @click="deleteHistory">删除</el-button>
        </div>
        <el-table :data="list" row-key="id" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" reserve-selection />
            <el-table-column label="名称" prop="name">
                <template #default="scope">
                    <el-link type="primary" @click="onSelect(scope.row.path)">{{
                        pathUtil.basename(scope.row.path)
                    }}</el-link>
                </template>
            </el-table-column>
            <el-table-column label="图片">
                <template #default="scope">
                    <el-image class="preview" :src="`${currentAccount.domain}/${scope.row.path}`" fit="cover" />
                </template>
            </el-table-column>
        </el-table>
        <el-pagination
            background
            class="mt30"
            :total="totalCount"
            hide-on-single-page
            :page-size="pageQuery.pageSize"
            v-model:current-page="pageQuery.pageIndex"
            @change="getList"
        />
    </el-drawer>
</template>

<script setup lang="ts">
import pathUtil from '@/renderer/utils/path';
import { ref, watch } from 'vue';
import { useGlobalConfigStore } from '@/renderer/hooks/common/useGlobalConfig';
import type { HistoryItem } from '@/shared/types';
const { currentAccount } = useGlobalConfigStore();
import { getHistoryList, removeHistory } from '@/renderer/api';
import { ElMessage, ElMessageBox } from 'element-plus';
const visible = defineModel<boolean>('visible', { required: true, default: false });
const pageQuery = ref({
    pageSize: 10,
    pageIndex: 1,
});

const totalCount = ref(0);
const list = ref<HistoryItem[]>([]);
const selectedIds = ref<string[]>([]);

watch(visible, () => {
    if (visible.value) {
        getList();
    }
});

const getList = async () => {
    const result = await getHistoryList(pageQuery.value);
    totalCount.value = result.totalCount;
    list.value = result.list;
};
/**
 * 选中某个上传记录，跳转
 * @param {string} filePath - 文件绝对路径
 */
const onSelect = (filePath: string) => {
    const { pathname } = new URL(`${currentAccount.value.domain}/${filePath}`);
    // breadcrumb.value = pathname.split('/').slice(1, -1);
    close();
    getList();
};
/**
 * 关闭历史记录抽屉
 */
const close = () => {
    visible.value = false;
    selectedIds.value = [];
};
/**
 * 处理选择变化
 * @param {HistoryItem[]} rows - 选中的行数据
 */
const handleSelectionChange = (rows: HistoryItem[]) => {
    selectedIds.value = rows.map((row) => row.id);
};
/**
 * 删除选中的历史记录
 */
const deleteHistory = async () => {
    if (!selectedIds.value.length) return;
    await ElMessageBox.confirm('确定删除选中的历史记录吗？', '提示', {
        type: 'warning',
    });
    await removeHistory(selectedIds.value);
    ElMessage.success('删除成功');
    selectedIds.value = [];
    getList();
};
/**
 * 关闭历史记录抽屉时调用
 */
const onClosed = () => {
    pageQuery.value.pageIndex = 1;
    list.value = [];
};
</script>
<style lang="scss" scoped>
.preview {
    width: 100px;
    height: 100px;
}
</style>
