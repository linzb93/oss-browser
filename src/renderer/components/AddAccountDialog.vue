<template>
    <el-dialog
        v-model="visible"
        :title="`${form.id ? '编辑' : '添加'}账号`"
        width="500px"
        @close="close"
        @closed="closed"
    >
        <el-form ref="formRef" :model="form" :rules="rules" label-suffix=":" label-width="130px">
            <el-form-item label="名称" prop="name">
                <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="平台" prop="platform">
                <el-select v-model="form.platform">
                    <el-option label="阿里云" :value="1" />
                </el-select>
            </el-form-item>
            <el-form-item label="region" prop="region">
                <el-input v-model="form.region" />
            </el-form-item>
            <el-form-item label="accessKeyId" prop="accessKeyId">
                <el-input v-model="form.accessKeyId" />
            </el-form-item>
            <el-form-item label="accessKeySecret" prop="accessKeySecret">
                <el-input v-model="form.accessKeySecret" />
            </el-form-item>
            <el-form-item label="bucket" prop="bucket">
                <el-select style="width: 267px" v-model="form.bucket" :disabled="disabled">
                    <el-option v-for="item in bucketList" :label="item.name" :value="item.name"></el-option>
                </el-select>
                <el-button type="primary" class="ml10" @click="getBuckets()">获取</el-button>
            </el-form-item>
            <el-form-item label="domain" prop="domain">
                <el-input v-model="form.domain" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" @click="submit">提交</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { AccountItem, BucketItem } from '@/shared/types';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { getBuckets as apiGetBuckets } from '@/renderer/api';

const visible = defineModel<boolean>('visible', { required: true, default: false });
const emit = defineEmits(['submit']);

const form = ref<AccountItem>({} as AccountItem);
const formRef = ref<FormInstance>();
const rules: FormRules = {
    name: {
        required: true,
        message: '请输入名称',
    },
    region: {
        required: true,
        message: '请输入地区',
    },
    accessKeyId: {
        required: true,
        message: '请输入accessKeyId',
    },
    accessKeySecret: {
        required: true,
        message: '请输入accessKeySecret',
    },
    bucket: {
        required: true,
        message: '请输入或选择bucket',
    },
    domain: [
        {
            required: true,
            message: '请输入domain前缀',
        },
        {
            pattern: /^https?\:\/\//,
            message: '请输入正确的domain前缀',
        },
    ],
};

const disabled = ref(true);
const bucketList = ref<BucketItem[]>([]);

const ossValidateProps = ['name', 'region', 'accessKeyId', 'accessKeySecret'];
/**
 * 校验OSS配置信息是否完整
 * @returns {Promise<boolean>} 是否校验通过
 */
const ossInfoSetted = async (): Promise<boolean> => {
    try {
        await formRef.value?.validateField(ossValidateProps);
    } catch (error) {
        return false;
    }
    return true;
};

const getBuckets = async () => {
    if (!(await ossInfoSetted())) {
        ElMessage.error('请填写完整OSS配置信息');
        return;
    }
    try {
        const res = await apiGetBuckets({
            region: form.value.region,
            accessKeyId: form.value.accessKeyId,
            accessKeySecret: form.value.accessKeySecret,
        });
        bucketList.value = res || [];
        disabled.value = false;
    } catch (error) {
        ElMessage.error('获取bucket列表失败');
    }
};

const submit = () => {
    emit('submit');
};
const close = () => {
    visible.value = false;
};
const closed = () => {
    form.value = {} as AccountItem;
};
</script>
<style lang="scss" scoped></style>
