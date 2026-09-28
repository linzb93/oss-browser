<template>
    <el-dialog v-model="visible" title="复制在线文件" width="560px" @closed="closed">
        <el-form ref="formRef" :model="form" :rules="rules" label-suffix=":" label-width="110px">
            <el-form-item label="在线地址" prop="url">
                <el-input
                    v-model="form.url"
                    placeholder="请输入在线文件地址，如 https://example.com/a.png"
                    clearable
                />
            </el-form-item>
            <el-form-item label="重命名" prop="rename">
                <el-switch v-model="form.rename" />
                <span class="tips">默认使用原名「{{ originName || '无法解析' }}」</span>
            </el-form-item>
            <el-form-item label="文件名称" prop="name" v-if="form.rename">
                <el-input v-model="form.name" placeholder="请输入文件名称" clearable />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" @click="submit">确定</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const visible = defineModel<boolean>('visible', { required: true, default: false });

const emit = defineEmits<{
    (e: 'confirm', payload: { url: string; name: string }): void;
}>();

const createForm = () => ({
    url: '',
    rename: false,
    name: '',
});

const form = ref(createForm());
const formRef = ref<FormInstance>();

const rules: FormRules = {
    url: {
        required: true,
        message: '请输入在线文件地址',
    },
    name: {
        required: true,
        message: '请输入文件名称',
    },
};

/**
 * 从在线地址里解析出原文件名，重命名关闭时就用它作为目标文件名
 * @returns {string} 原文件名，解析不出时返回空字符串
 */
const originName = computed(() => {
    const raw = form.value.url.trim();
    if (!raw) {
        return '';
    }
    try {
        const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        const segment = new URL(normalized).pathname.split('/').filter(Boolean).pop() || '';
        return decodeURIComponent(segment);
    } catch {
        return '';
    }
});

/**
 * 开启重命名时用原名预填，方便在此基础上修改
 */
watch(
    () => form.value.rename,
    (rename) => {
        if (rename && !form.value.name) {
            form.value.name = originName.value;
        }
    },
);

const submit = async () => {
    try {
        await formRef.value?.validate();
    } catch {
        return;
    }
    const name = form.value.rename ? form.value.name.trim() : originName.value;
    if (!name) {
        ElMessage.error('无法从在线地址中解析出文件名，请开启重命名');
        return;
    }
    emit('confirm', {
        url: form.value.url.trim(),
        name,
    });
    visible.value = false;
};

const closed = () => {
    form.value = createForm();
    formRef.value?.clearValidate();
};
</script>
<style lang="scss" scoped>
.tips {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
}
</style>
