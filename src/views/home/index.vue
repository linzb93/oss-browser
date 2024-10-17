<template>
  <template v-if="list.length">
    <el-button type="primary" @click="add">添加账号</el-button>
    <el-table :data="list">
      <el-table-column label="ID" prop="id"></el-table-column>
      <el-table-column label="名称" prop="name"></el-table-column>
      <el-table-column label="平台">
        <template #default="scope">
          {{ getPlatformName(scope.row.platform) }}
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <div class="flexalign-center">
            <el-link type="primary" :underline="false" @click="jump(scope.row)"
              >进入</el-link
            >
            <el-link
              type="primary"
              :underline="false"
              class="mr10"
              @click="edit(scope.row)"
              >编辑</el-link
            >
            <el-dropdown
              @command="(cmd) => handleCommand(scope.row, cmd)"
              class="more-dropdown"
            >
              <el-link type="primary" :underline="false">
                <span>更多操作</span>
                <el-icon :size="14">
                  <arrow-down v-if="!scope.row.expanded" />
                  <arrow-up v-else />
                </el-icon>
              </el-link>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="delete"
                    ><el-text type="danger">移除</el-text></el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </template>
  <div class="flex-center full-height" v-else>
    <el-empty>
      <template #description>
        <span></span>
      </template>
      <el-button type="primary" @click="add">添加您的第一个账号</el-button>
    </el-empty>
  </div>
  <add-dialog :detail="form" v-model:visible="visible" @submit="getList" />
</template>

<script setup>
import { ref, shallowRef, onMounted } from "vue";
import { useRouter } from "vue-router";
import { omit } from "lodash-es";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown, ArrowUp } from "@element-plus/icons-vue";
import request from "@/helpers/request";
import { useOssStore } from "@/store";
import AddDialog from "./components/AddDialog.vue";

const router = useRouter();
const ossStore = useOssStore();

const list = ref([]);
const getList = async () => {
  const data = await request("home-getList");
  list.value = data.list;
};
onMounted(async () => {
  // await getList();
  // jumpIfFastEnterSetted();
  router.push({
    path: "/fileList",
    query: {
      id: 1,
    },
  });
});

// 如果有设置快捷进入的客户端，就直接进入文件列表页面
const jumpIfFastEnterSetted = () => {
  const accounts = list.value;
  const matchAccount = accounts.find((account) => !!account.isDefaultAccount);
  if (!matchAccount) {
    return;
  }
  router.replace({
    path: "/fileList",
    query: {
      id: matchAccount.id,
    },
  });
};
const visible = shallowRef(false);
const add = () => {
  visible.value = true;
};
const edit = (item) => {
  visible.value = true;
  form.value = item;
};
const form = ref({});

const getPlatformName = (type) => {
  if (type === 1) {
    return "阿里云";
  }
  return "";
};
const jump = (item) => {
  ossStore.platform = item;
  router.push({
    path: "/fileList/",
    query: {
      id: item.id,
    },
  });
};

const handleCommand = (row, cmd) => {
  if (cmd === "copy") {
    edit(omit(row, ["id"]));
    return;
  }
  if (cmd === "delete") {
    ElMessageBox.confirm(`确认删除账号【${row.name}】？`, "温馨提醒", {
      confirmButtonText: "删除",
    })
      .then(async () => {
        await request("home-removeAccount", {
          id: row.id,
        });
        ElMessage.success("移除成功");
        getList();
      })
      .catch(() => {
        //
      });
  }
};
</script>
<style lang="scss" scoped>
.el-link + .el-link {
  margin-left: 10px;
}
.more-dropdown {
  position: relative;
  top: -1px;
}
</style>
