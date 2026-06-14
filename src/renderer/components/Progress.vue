<template>
    <el-drawer
        title="上传进度"
        size="50%"
        style="width: 800px; left: auto"
        v-model="visible"
        direction="btt"
        @close="close"
        @closed="closed"
    >
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
                        :underline="false"
                        @click="requestActions.copy(`${currentAccount.domain}/${scope.row.path}`)"
                        >复制</el-link
                    >
                </template>
            </el-table-column>
        </el-table>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, unref } from 'vue';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { request, requestActions } from '@/renderer/utils/request';
import pathUtils from '@/renderer/utils/path';
import { getSize } from '@/renderer/utils/size';
import { useAccount } from '@/renderer/hooks/service/useAccount';
import { useUpload } from '@/renderer/hooks/service/useUpload';
import { useBreadcrumb } from '@/renderer/hooks/common/useBreadcrumb';
import { useSettingStore } from '@/renderer/hooks/common/useSetting';

const emit = defineEmits(['refresh']);
const visible = defineModel<boolean>('visible', { required: true, default: false });

interface ListItem {
    path: string;
}
const { currentAccount } = useAccount();

const { uploadingList } = useUpload();
const { fullPath } = useBreadcrumb();

const list = ref<ListItem[]>([]);
const finished = ref(false);
let removeEvt = () => {};

/**
 * 开始上传文件
 */
const startUpload = () => {
    const { listener, removeListener } = request.send('oss:upload', {
        prefix: fullPath.value,
        names: uploadingList.value.map((item) => item.path).join(','),
        type: 'file',
    });
    listener((obj: { data: any; type: 'upload-finished' | 'uploading' }) => {
        const { type, data } = obj;
        if (type === 'upload-finished') {
            // 上传完成，显示批量操作按钮
            finished.value = true;
            removeEvt();
            ElMessage.success('上传成功');
        }
        list.value = data;
    });
    removeEvt = removeListener;
};
watch(visible, (data) => {
    if (!data) {
        return;
    }
    startUpload();
});
/**
 * 关闭抽屉组件
 */
const close = () => {
    visible.value = false;
};
/**
 * 处理抽屉组件关闭事件
 */
const closed = () => {
    list.value = [];
    removeEvt();
    emit('refresh');
};
</script>
<style scoped lang="scss">
.el-link + .el-link {
    margin-left: 10px;
}
.loading {
    width: 16px;
    height: 16px;
    border: 2px solid #409eff;
    border-right-color: transparent;
    border-radius: 50%;
    animation: rotate 1s linear infinite;
}
</style>
