<template>
  <el-dialog
    v-model="showTemplateEditor"
    :title="`${isTemplateEdit ? '编辑' : '添加'}模板`"
    width="500px"
    append-to-body
    @close="close"
  >
    <el-form ref="formRef" :rules="rules" :model="form">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="模板">
        <el-input type="textarea" v-model="form.content" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, shallowRef, watch } from "vue";
const props = defineProps({
  visible: Boolean,
  setting: Object,
});
const emit = defineEmits(["update:visible", "submit"]);
watch(props, ({ visible }) => {
  if (!visible) {
    return;
  }
  form.value = cloneDeep(props.setting);
  request("fileList-getTemplateList").then((res) => {
    templates.value = res;
  });
});
</script>
<style lang="scss" scoped></style>
