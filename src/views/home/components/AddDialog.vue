<template>
  <el-dialog
    :model-value="visible"
    :title="`${form.id ? '编辑' : '添加'}账号`"
    width="400"
    @close="close"
  >
    <el-form :model="form" :rules="rules" label-suffix=":" label-width="130px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="平台">
        <el-select v-model="form.platform">
          <el-option label="阿里云" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="region">
        <el-input v-model="form.region" />
      </el-form-item>
      <el-form-item label="accessKeyId">
        <el-input v-model="form.accessKeyId" />
      </el-form-item>
      <el-form-item label="accessKeySecret">
        <el-input v-model="form.accessKeySecret" />
      </el-form-item>
      <el-form-item label="bucket">
        <el-input v-model="form.bucket" />
      </el-form-item>
      <el-form-item label="domain">
        <el-input v-model="form.domain" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, readonly } from "vue";
import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash-es";
import request from "@/helpers/request";

const props = defineProps({
  visible: Boolean,
  detail: Object,
});
const emit = defineEmits(["update:visible", "submit"]);
const form = ref(cloneDeep(props.detail));
const rules = readonly({});
const submit = async () => {
  await request("home-create", form.value);
  ElMessage.success({
    message: form.value.id ? "编辑成功" : "添加成功",
    duration: 1500,
    onClose() {
      close();
      emit("submit");
    },
  });
};
const close = () => {
  emit("update:visible", false);
};
</script>
<style lang="scss" scoped></style>
