<template>
    <el-drawer :size="800" v-model="visible" title="历史记录" @close="close" @closed="init">
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
                    <el-image class="preview" :src="`${userInfo.domain}/${scope.row.path}`" fit="cover" />
                </template>
            </el-table-column>
        </el-table>
        <el-pagination
            background
            class="mt30"
            :total="totalCount"
            hide-on-single-page
            :page-size="query.pageSize"
            v-model:current-page="query.pageIndex"
            @change="getList"
        />
    </el-drawer>
</template>

<script setup lang="ts">
import pathUtil from '@/helpers/path';
import useHistory from '../hooks/useHistory';
import useLogin from '@/views/home/hooks/useLogin';
const { userInfo } = useLogin();

const {
    getList,
    pageQuery: query,
    totalCount,
    list,
    onSelect,
    visible,
    close,
    init,
    selectedIds,
    handleSelectionChange,
    deleteHistory,
} = useHistory();
init();
</script>
<style lang="scss" scoped>
.preview {
    width: 100px;
    height: 100px;
}
</style>
