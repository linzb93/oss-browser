<template>
  <el-dialog
    title="收藏夹"
    width="600px"
    :model-value="visible"
    @close="close"
    @closed="closed"
  >
    <ul>
      <li class="flexalign-center" v-for="item in collectList" :key="item.path">
        <span class="dot"></span>
        <span class="name" v-if="!item.isEdit">{{ item.name }}</span>
        <el-input
          size="small"
          class="input-name"
          v-model="item.name"
          v-else
          @keypress.native.stop.prevent.enter="item.isEdit = false"
        />
        <el-tooltip :content="item.path"
          ><span class="path">{{ item.path }}</span></el-tooltip
        >
        <span class="icons">
          <el-icon :size="18" @click="enter(item)" title="进入"
            ><right
          /></el-icon>
          <el-icon :size="18" title="编辑" @click="item.isEdit = !item.isEdit"
            ><edit
          /></el-icon>
          <el-icon :size="18" title="删除" @click="deleteItem(item)"
            ><delete
          /></el-icon>
        </span>
      </li>
    </ul>
    <el-button class="mt30" type="primary" @click="save">保存</el-button>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import request from "@/helpers/request";
import { omit } from "lodash-es";
import { ElMessage } from "element-plus";
import { Edit, Delete, Right } from "@element-plus/icons-vue";
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
@import "@/styles/mixin";
li {
  font-size: 16px;
}
.input-name {
  width: 120px;
  margin-right: 10px;
}
.dot {
  width: 6px;
  height: 6px;
  background: #333;
  border-radius: 50%;
  margin-right: 10px;
}
.name {
  @include textOverflow;
  margin-right: 10px;
  width: 120px;
}
.path {
  @include textOverflow;
  width: 200px;
}
.icons {
  .el-icon {
    margin-left: 10px;
    cursor: pointer;
  }
}
</style>
