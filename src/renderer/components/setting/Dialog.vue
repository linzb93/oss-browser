<template>
<el-dialog v-model="visible" title="设置" width="740px" @closed="onClosed">
<el-tabs type="card" v-model="activeTab">
  <el-tab-pane label="样式复制管理" name="copy-style-manage">
    <copy-style @close="onClose" />
  </el-tab-pane>
  <el-tab-pane label="收藏夹管理" name="collect-manage">
    <collect @close="onClose" />
  </el-tab-pane>
</el-tabs>

</el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Collect from './Collect.vue';
import CopyStyle from './CopyStyle.vue';

const visible = defineModel<boolean>('visible', { required: true, default: false });

watch(visible, (vis) => {
  if (!vis) {
    return;
  }
  activeTab.value = 'copy-style-manage';
});

const activeTab = ref('');

const onClose = () => {
  visible.value = false;
}
const onClosed = () => {
  activeTab.value = '';
}
</script>
<style lang="scss" scoped>

</style>