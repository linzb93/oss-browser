<template>
<el-dialog v-model="visible" title="上传与下载" width="740px" @closed="onClosed">
<el-tabs type="card" v-model="activeTab">
  <el-tab-pane label="上传管理" name="during-upload">
    <file-upload @refresh="emit('refresh')" />
  </el-tab-pane>
  <el-tab-pane label="下载管理" name="during-download">
    <file-download />
  </el-tab-pane>
  <el-tab-pane label="上传历史" name="upload-history">
    <upload-history @select="visible = false" />
  </el-tab-pane>
</el-tabs>

</el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import UploadHistory from './UploadHistory.vue';
import FileUpload from './FileUpload.vue';
import FileDownload from './FileDownload.vue';
import { useDownload } from '@/renderer/hooks/service/useDownload';

const visible = defineModel<boolean>('visible', { required: true, default: false });

const emit = defineEmits(['refresh']);

const { downloading } = useDownload();

const activeTab = ref('');
watch(visible, (vis) => {
    if (!vis) {
        return;
    }
    // 下载过程中打开弹窗时，直接展示下载进度
    activeTab.value = downloading.value ? 'during-download' : 'during-upload';
});
const onClosed = () => {
    activeTab.value = '';
};
</script>
<style lang="scss" scoped>

</style>
