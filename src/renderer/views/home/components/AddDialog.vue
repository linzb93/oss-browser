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
                <el-button type="primary" class="ml10" @click="getBuckets(true)">获取</el-button>
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

<script setup>
import { useRouter } from 'vue-router';
import useLogin from '../hooks/useLogin';

const emit = defineEmits(['submit']);
const router = useRouter();
const { getFormData, login, form, rules, formRef, getBuckets, bucketList, disabled, close, closed, visible } =
    useLogin(router);
getFormData();
const submit = () => {
    login().then(() => {
        emit('submit');
    });
};
</script>
<style lang="scss" scoped></style>
