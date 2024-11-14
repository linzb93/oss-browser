<template>
    <div class="login-page flex-center">
        <div class="login-pane">
            <h1>阿里OSS客户端</h1>
            <el-form :model="form" :rules="rules" label-suffix=":" label-width="130px">
                <el-form-item label="名称">
                    <el-input v-model="form.name" />
                </el-form-item>
                <el-form-item label="region">
                    <el-input v-model="form.region" />
                </el-form-item>
                <el-form-item label="accessKeyId">
                    <el-input v-model="form.accessKeyId" />
                </el-form-item>
                <el-form-item label="accessKeySecret">
                    <el-input v-model="form.accessKeySecret" />
                </el-form-item>
                <el-form-item label="bucket">
                    <el-input v-model="form.bucket" />
                </el-form-item>
                <el-form-item label="domain">
                    <el-input v-model="form.domain" />
                </el-form-item>
                <el-button type="primary" class="btn-login" @click="login">登录</el-button>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, readonly, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/helpers/request';
import { useRouter } from 'vue-router';
import { getInfo, doLogin } from '@/api/login';
const router = useRouter();
const form = ref({
    name: '',
    platform: 1,
    region: '',
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    domain: '',
});
const rules = readonly({});
onMounted(async () => {
    form.value = await getInfo();
});

const login = async () => {
    await doLogin(form.value);
    ElMessage.success({
        message: '添加成功',
        duration: 1500,
        onClose() {
            router.push('/');
        },
    });
};
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
