<template>
<div class="ctrl-bar flexalign-center">
            <el-button
                type="primary"
                @click="requestActions.copy(list.map((item) => `${currentAccount.domain}/${item.path}`).join('\n'))"
                >复制全部</el-button
            >
        </div>
        <el-table :data="list" :border="false">
            <el-table-column label="状态">
                <template #default="scope">
                    <el-progress
                        v-if="!scope.row.finished"
                        type="circle"
                        status="success"
                        :percentage="scope.row.progress"
                        :width="16"
                        :stroke-width="2"
                    />
                    <el-icon color="#67C23A" :size="16" v-else>
                        <check />
                    </el-icon>
                </template>
            </el-table-column>
            <el-table-column prop="name" label="名称">
                <template #default="scope">
                    {{ pathUtils.basename(scope.row.path) }}
                </template>
            </el-table-column>
            <el-table-column prop="size" label="尺寸">
                <template #default="scope">
                    {{ getSize(scope.row) }}
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template #default="scope">
                    <el-link
                        type="primary"
                        underline="never"
                        @click="requestActions.copy(`${currentAccount.domain}/${scope.row.path}`)"
                        >复制</el-link
                    >
                </template>
            </el-table-column>
        </el-table>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { requestActions } from '@/renderer/utils/request';
import pathUtils from '@/renderer/utils/path';
import { getSize } from '@/renderer/utils/size';
import { useAccount } from '@/renderer/hooks/service/useAccount';
import { handleMainPost } from '@/renderer/utils';
const emit = defineEmits(['refresh']);

interface ListItem {
    path: string;
    size: number;
    progress?: number;
    finished: boolean;
}
const { currentAccount } = useAccount();
const list = ref<ListItem[]>([]);
const finished = ref(false);
let removeMainPost = () => {};

/**
 * 渲染上传进度
 */
const renderUploadProgress = () => {
    removeMainPost = handleMainPost(
        'upload-progress',
        ({ type, data }: { type: 'upload-finished' | 'uploading'; data: ListItem[] }) => {
            if (type === 'upload-finished') {
                // 上传完成，显示批量操作按钮
                finished.value = true;
                ElMessage.success('上传成功');
            }
            list.value = data;
        },
    );
};

onMounted(() => {
    renderUploadProgress();
});

onUnmounted(() => {
    list.value = [];
    removeMainPost();
    emit('refresh');
})
</script>
<style lang="scss" scoped>

</style>