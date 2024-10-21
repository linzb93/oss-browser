<template>
  <el-drawer
    title="收藏夹"
    size="50%"
    :model-value="visible"
    direction="ttb"
    @close="close"
    @closed="closed"
  >
    <el-table :data="collectList">
      <el-table-column label="名称">
        <template #default="scope">
          <span v-if="!scope.row.isEdit">{{ scope.row.name }}</span>
          <el-input
            size="small"
            class="input-name"
            v-model="scope.row.name"
            v-else
            @keypress.native.stop.prevent.enter="scope.row.isEdit = false"
          />
        </template>
      </el-table-column>
      <el-table-column label="地址" prop="path"></el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="primary" size="small" @click="enter(scope.row)"
            >进入</el-button
          >
          <el-button
            type="primary"
            size="small"
            :disabled="scope.row.isEdit"
            @click="scope.row.isEdit = !scope.row.isEdit"
            >编辑</el-button
          >
          <el-button type="danger" size="small" @click="deleteItem(scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-button class="mt30" type="primary" @click="save">保存</el-button>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from "vue";
import request from "@/helpers/request";
import { omit } from "lodash-es";
import { ElMessage } from "element-plus";
const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(["update:visible", "enter"]);

const collectList = ref([]);

watch(props, async ({ visible }) => {
  if (!visible) {
    return;
  }
  const list = await request("file-getCollect");
  collectList.value = list.map((item) => ({
    ...item,
    isEdit: false,
  }));
});

const deleteItem = (target) => {
  collectList.value = collectList.value.filter((item) => item.id !== target.id);
};
const enter = (target) => {
  emit("enter", target.path);
  close();
};
const save = async () => {
  await request(
    "file-saveCollect",
    collectList.value.map((item) => omit(item, ["isEdit"]))
  );
  ElMessage.success("保存成功");
};
const close = () => {
  emit("update:visible", false);
};
const closed = () => {
  collectList.value = [];
};
</script>
<style lang="scss" scoped>
.input-name {
  width: 200px;
}
</style>
