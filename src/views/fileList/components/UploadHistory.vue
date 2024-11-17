<template>
    <el-drawer :size="800" v-model="visible" title="历史记录" @close="close" @closed="closed">
        <el-table :data="list">
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
import useLogin from '@/views/login/hooks/useLogin';

const emit = defineEmits(['update:visible', 'select']);
const { userInfo } = useLogin();

const { getList, pageQuery: query, totalCount, list, onSelect, visible, close } = useHistory();

const closed = () => {
    query.value.pageIndex = 1;
    list.value = [];
    totalCount.value = 0;
};
</script>
<style lang="scss" scoped>
.preview {
    width: 100px;
    height: 100px;
}
</style>
