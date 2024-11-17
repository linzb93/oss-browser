<template>
    <el-dialog
        v-model="visible"
        :title="`${form.id ? '编辑' : '添加'}模板`"
        width="500px"
        append-to-body
        @close="close"
    >
        <el-form ref="formRef" :rules="rules" :model="form" label-suffix="：">
            <el-form-item label="名称">
                <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="模板">
                <el-input type="textarea" v-model="form.content" :rows="6" resize="none" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="close">取消</el-button>
            <el-button type="primary" @click="save">保存</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { readonly, ref } from 'vue';
import useTemplate from '../hooks/useTemplate';

const emit = defineEmits(['update:visible', 'submit']);
const { visible, currentItem: form, save, close } = useTemplate();
const rules = readonly({});
const formRef = ref(null);
</script>
<style lang="scss" scoped></style>
