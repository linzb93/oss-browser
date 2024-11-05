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
                    <div class="loading" v-if="!scope.row.success"></div>
                    <el-icon color="#67C23A" :size="16" v-else>
                        <check />
                    </el-icon>
                </template>
            </el-table-column>
            <el-table-column prop="name" label="名称"></el-table-column>
            <el-table-column prop="size" label="尺寸"></el-table-column>
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

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import { Check } from '@element-plus/icons-vue';
import request, { requestUtil } from '@/helpers/request';
import { useOssStore } from '@/store';

const ossStore = useOssStore();
const props = defineProps({
    visible: Boolean,
    uploadList: Array,
    path: String,
});
const emit = defineEmits(['update:visible', 'refresh']);

const list = ref([]);
let removeEvt = () => {};

const startUpload = () => {
    const { listener, removeListener } = request.send('oss-add-path', {
        prefix: props.path,
        name: list.value.map((item) => item.path).join(','),
        type: 'file',
    });
    listener((data) => {
        const { type, name, progress } = data;
        if (type === 'uploading') {
            /**
             * 还在上传。
             * 对比现有列表，如果不存在，就补充在最后，否则更新进度
             */
        } else if (type === 'upload-finished') {
            // 上传完成，显示批量操作按钮
            removeEvt();
        }
    });
    removeEvt = removeListener;
    ElMessage.success('上传成功');
    emit('refresh');
    list.value = list.value.map((item) => ({ ...item, success: true }));
};
watch(props, ({ visible }) => {
    if (!visible) {
        return;
    }
    list.value = cloneDeep(
        props.uploadList.map((item) => ({
            ...item,
            success: false,
        }))
    );
    startUpload();
});

// 撤销
const redo = async (item) => {
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
