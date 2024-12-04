<template>
    <el-drawer
        title="上传进度"
        size="50%"
        style="width: 800px; left: auto"
        :model-value="visible"
        direction="btt"
        @close="close"
        @closed="closed"
    >
        <div class="ctrl-bar flexalign-center">
            <el-button
                type="primary"
                @click="
                    requestUtil.copy(
                        list.map((item) => `${ossStore.platform.domain}/${props.path}${item.name}`).join('\n')
                    )
                "
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
                    {{ pathUtils.basename(scope.row.name) }}
                </template>
            </el-table-column>
            <el-table-column prop="size" label="尺寸">
                <template #default="scope">
                    {{ getSize(scope.row) }}
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template #default="scope">
                    <el-popconfirm title="确认撤销" placement="top" @confirm="redo(scope.row)">
                        <template #reference>
                            <el-link type="primary" :underline="false">撤销</el-link>
                        </template>
                    </el-popconfirm>
                    <el-link
                        type="primary"
                        :underline="false"
                        @click="requestUtil.copy(`${ossStore.platform.domain}/${props.path}${scope.row.name}`)"
                        >复制</el-link
                    >
                </template>
            </el-table-column>
        </el-table>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import request, { requestUtil } from '@/helpers/request';
import { useOssStore } from '@/store';
import pathUtils from '@/helpers/path';
import { getSize } from '@/helpers/size';

const ossStore = useOssStore();
const props = defineProps<{
    visible: boolean;
    path: string;
    uploadList: any[];
}>();
const emit = defineEmits(['update:visible', 'refresh']);

interface ListItem {
    name: string;
}

const list = ref<ListItem[]>([]);
const finished = shallowRef(false);
let removeEvt = () => {};

const startUpload = () => {
    const { listener, removeListener } = request.send('oss-upload', {
        prefix: props.path,
        name: props.uploadList.map((item) => item.path).join(','),
        type: 'file',
    });
    listener((obj: { data: any; type: 'upload-finished' | 'uploading' }) => {
        console.log(obj);
        const { type, data } = obj;
        if (type === 'upload-finished') {
            // 上传完成，显示批量操作按钮
            finished.value = true;
            removeEvt();
            ElMessage.success('上传成功');
            emit('refresh');
        }
        list.value = data;
    });
    removeEvt = removeListener;
};
watch(props, ({ visible }) => {
    if (!visible) {
        return;
    }
    startUpload();
});

// 撤销
const redo = async (item: ListItem) => {
    await request('oss-delete', {
        path: `${props.path}${item.name}`,
    });
    ElMessage.success('撤销成功');
    list.value = list.value.filter((file) => file.name !== item.name);
    emit('refresh');
};
const close = () => {
    emit('update:visible', false);
};
const closed = () => {
    list.value = [];
    removeEvt();
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
