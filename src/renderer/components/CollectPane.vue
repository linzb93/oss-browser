<template>
    <el-dialog title="收藏夹" width="600px" v-model="visible" @close="close">
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
import { ref, watch } from 'vue';
import { cloneDeep, omit } from 'lodash-es';
import { ElMessage } from 'element-plus';
import { useBreadcrumb } from '@/renderer/hooks/common/useBreadcrumb';
import { CollectItem } from '@/shared/types';
import { getCollect, addCollect, setCollect } from '@/renderer/api';
import { Edit, Delete, Right } from '@element-plus/icons-vue';

const { fullPath } = useBreadcrumb();

interface FormCollectItem extends CollectItem {
    isEdit: boolean;
}
const list = ref<CollectItem[]>([]);

const formList = ref<FormCollectItem[]>([]);

const visible = defineModel<boolean>('visible', { required: true, default: false });

/**
 * 获取收藏列表。
 */
const getList = async () => {
    const data = await getCollect();
    list.value = data;
    formList.value = data.map((item) => ({
        ...item,
        isEdit: false,
    }));
};
/**
 * 添加收藏目录
 */
const add = async () => {
    if (list.value.find((item) => item.path === fullPath.value)) {
        ElMessage.warning('收藏目录已存在');
        return;
    }
    await addCollect({
        path: fullPath.value,
    });
    ElMessage.success('添加成功');
};
/**
 * 保存收藏目录
 */
const save = async () => {
    await setCollect(formList.value.map((item) => omit(item, ['isEdit'])));
    list.value = cloneDeep(formList.value);
    ElMessage.success('保存成功');
};
/**
 * 删除收藏目录。因为是批量保存，所以删除功能不通过调用接口。
 */
const deleteItem = async (target: FormCollectItem) => {
    formList.value = formList.value.filter((item) => item.path !== target.path);
};
/**
 * 进入收藏目录
 */
const enter = (item: FormCollectItem) => {
    visible.value = true;
};
/**
 * 关闭收藏目录
 */
const close = () => {
    visible.value = false;
};
</script>
<style lang="scss" scoped>
@import '@/renderer/styles/mixin';
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
