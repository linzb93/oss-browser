<template>
    <el-dialog title="收藏夹" width="600px" :model-value="visible" @close="close">
        <ul v-if="formList.length">
            <li class="flexalign-center" v-for="item in formList" :key="item.path">
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
                    <el-icon :size="18" @click="enter(item)" title="进入"><right /></el-icon>
                    <el-icon :size="18" title="编辑" @click="item.isEdit = !item.isEdit"><edit /></el-icon>
                    <el-icon :size="18" title="删除" @click="deleteItem(item)"><delete /></el-icon>
                </span>
            </li>
        </ul>
        <el-empty v-else></el-empty>
        <el-button class="mt30" type="primary" @click="save" v-if="formList.length">保存</el-button>
    </el-dialog>
</template>

<script setup lang="ts">
import useCollect from '../hooks/useCollect';
import { Edit, Delete, Right } from '@element-plus/icons-vue';
const { formList, save, deleteItem, visible, init, enter, close } = useCollect();
init();
</script>
<style lang="scss" scoped>
@import '@/styles/mixin';
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
