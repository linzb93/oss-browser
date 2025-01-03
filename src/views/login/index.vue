<template>
    <div class="login-page flex-center">
        <div class="login-pane">
            <h1>阿里OSS客户端</h1>
            <el-form :model="form" ref="formRef" :rules="rules" label-suffix=":" label-width="130px">
                <el-form-item label="名称" prop="name">
                    <el-input v-model="form.name" />
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
                    <el-select style="width: 200px" v-model="form.bucket" :disabled="disabled">
                        <el-option v-for="item in bucketList" :label="item.name" :value="item.name"></el-option>
                    </el-select>
                    <el-button type="primary" class="ml10" @click="getBuckets(true)">获取</el-button>
                </el-form-item>
                <el-form-item label="domain" prop="domain">
                    <el-input v-model="form.domain" />
                </el-form-item>
                <el-button type="primary" class="btn-login" @click="login">登录</el-button>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import useLogin from './hooks/useLogin';

const router = useRouter();
const { getFormData, login, form, rules, formRef, getBuckets, bucketList, disabled } = useLogin(router);
getFormData();
</script>
<style lang="scss" scoped>
.login-page {
    height: 100%;
    background: #f0f0f0;
    margin: -10px;
}
.el-form {
    width: 400px;
}
.login-pane {
    background: #fff;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
    padding: 20px 30px;
    border-radius: 4px;
    h1 {
        font-size: 30px;
        margin-bottom: 15px;
        text-align: center;
    }
    .btn-login {
        width: 100%;
        margin-top: 20px;
        height: 50px;
        font-size: 20px;
    }
}
</style>
