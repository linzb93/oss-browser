<template>
  <el-drawer
    title="收藏夹"
    size="50%"
    style="width: 800px; left: auto"
    :model-value="visible"
    direction="ttb"
    @close="close"
    @closed="closed"
  >
    <ul class="collect-list">
      <li v-for="item in collectList" :key="item.path">
        <span v-if="!item.isEdit">{{ item.name }}</span>
        <el-input
          size="small"
          v-model="item.name"
          v-else
          @keypress.native.stop.prevent.enter="item.isEdit = false"
        />
        {{ item.path }}
        <el-icon :size="14" @click="item.isEdit = true"><Edit /></el-icon>
        <el-icon :size="14" @click="deleteItem(item)"><Delete /></el-icon>
      </li>
    </ul>
    <el-button type="primary" @click="save">保存</el-button>
  </el-drawer>
</template>

<script setup>
import { ref, shallowRef, watch } from "vue";
import request from "@/helpers/request";
import { omit } from "lodash-es";
import { Edit, Delete } from "@element-plus/icons-vue";
const props = defineProps({
  visible: Boolean,
});

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
const save = async () => {
  await request(
    "file-editCollect",
    collectList.value.map((item) => omit(item, ["isEdit"]))
  );
};
</script>
<style lang="scss" scoped></style>
