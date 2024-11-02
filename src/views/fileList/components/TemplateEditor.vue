<template>
    <el-dialog
        :model-value="visible"
        :title="`${form.id ? '编辑' : '添加'}模板`"
        width="500px"
        append-to-body
        @close="close"
        @closed="closed"
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

<script setup>
import { ElMessage } from 'element-plus';
import { readonly, ref, watch } from 'vue';
import request from '@/helpers/request';
const props = defineProps({
    visible: Boolean,
    detail: Object,
});
const emit = defineEmits(['update:visible', 'submit']);
const form = ref({
    id: '',
    name: '',
    content: '',
});
const rules = readonly({});
const formRef = ref(null);
watch(props, ({ visible }) => {
    if (!visible) {
        return;
    }
    if (props.detail.id) {
        request('get-template', {
            id: props.detail.id,
        }).then((res) => {
            form.value = res || {
                id: '',
                name: '',
                content: '',
            };
        });
    } else {
        form.value = {
            id: '',
            name: '',
            content: '',
        };
    }
});
const save = () => {
    formRef.value
        .validate()
        .then(() => {
            const apiName = form.value.id ? 'edit-template' : 'add-template';
            return request(apiName, form.value);
        })
        .then(() => {
            ElMessage.success({
                message: `${form.value.id ? '编辑' : '添加'}成功`,
                onClose: () => {
                    emit('submit');
                    close();
                },
            });
        })
        .catch(() => {});
};
const close = () => {
    emit('update:visible', false);
};
const closed = () => {
    formRef.value.clearValidate();
    form.value = {
        id: '',
        name: '',
        content: '',
    };
};
</script>
<style lang="scss" scoped></style>
