<template>
    <el-drawer :size="800" :model-value="visible" title="历史记录" @close="close" @closed="closed">
        <el-table :data="list">
            <el-table-column label="名称" prop="name">
                <template #default="scope">
                    <el-link type="primary" @click="gotoFile(scope.row)">{{
                        pathUtil.basename(scope.row.path)
                    }}</el-link>
                </template>
            </el-table-column>
            <el-table-column label="图片">
                <template #default="scope">
                    <el-image class="preview" :src="`${props.domain}/${scope.row.path}`" fit="cover" />
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
import { watch } from 'vue';
import pathUtil from '@/helpers/path';
import useHistory from '../hooks/useHistory';
const props = defineProps({
    visible: Boolean,
    domain: String,
});
const emit = defineEmits(['update:visible', 'select']);

interface HistoryItem {
    path: string;
}

watch(props, ({ visible }) => {
    if (!visible) {
        return;
    }
    getList();
});

const { getList, pageQuery: query, totalCount, list } = useHistory();

const gotoFile = (row: HistoryItem) => {
    close();
    emit('select', row.path);
};
const close = () => {
    emit('update:visible', false);
};
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
