<template>
    <el-dialog v-model="visible" title="账号管理" width="800px" @close="handleClose">
        <template v-if="list.length">
            <el-button type="primary" @click="add">添加账号</el-button>
            <el-table :data="list" class="mt10">
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
                            <el-link type="primary" :underline="false" @click="onJump(scope.row)">进入</el-link>
                            <el-link type="primary" :underline="false" class="mr10" @click="edit(scope.row)"
                                >编辑</el-link
                            >
                            <el-dropdown @command="(cmd) => handleCommand(scope.row, cmd)" class="more-dropdown">
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
    </el-dialog>
</template>

<script setup>
import { watch } from 'vue';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import useAccount from '@/renderer/hooks/useAccount';

const { list, getList, add, edit, getPlatformName, handleCommand } = useAccount();

const visible = defineModel < boolean > { required: true, default: false };
const emit = defineEmits(['close', 'jump']);

watch(
    visible,
    (val) => {
        if (val) {
            getList();
        }
    },
    { immediate: true },
);

const onJump = (item) => {
    emit('jump', item);
};

const handleClose = () => {
    emit('close');
};
</script>
<style lang="scss" scoped>
.mt10 {
    margin-top: 10px;
}
.el-link + .el-link {
    margin-left: 10px;
}
.more-dropdown {
    position: relative;
    top: -1px;
}
</style>
