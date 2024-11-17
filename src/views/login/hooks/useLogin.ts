import { ref, readonly, onMounted } from 'vue';
import request from '@/helpers/request';
import { Router } from 'vue-router';
import { cloneDeep } from 'lodash-es';
import { ElMessage } from 'element-plus';
interface LoginParams {
    name: string;
    platform: number;
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    domain: string;
    id: number;
}

const doLogin = async (params: LoginParams) => {
    await request('login-save', params);
};

const getInfo = async (): Promise<LoginParams> => {
    return await request('login-get');
};

const userInfo = ref<LoginParams>({
    id: 1,
    domain: '',
    platform: 1,
    name: '',
    region: '',
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
});
export default (router?: Router) => {
    const form = ref<LoginParams>({
        id: 1,
        domain: '',
        platform: 1,
        name: '',
        region: '',
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
    });
    const rules = readonly({});
    return {
        userInfo,
        form,
        rules,
        async login() {
            await doLogin(form.value);
            userInfo.value = cloneDeep(form.value);
            ElMessage.success({
                message: '添加成功',
                duration: 1500,
                onClose() {
                    router?.push('/');
                },
            });
        },
        getFormData() {
            onMounted(async () => {
                const data = await getInfo();
                userInfo.value = data;
                form.value = data;
            });
        },
        checkLogin(): Promise<null> {
            return new Promise((resolve) => {
                getInfo().then((data) => {
                    userInfo.value = data;
                    if (!userInfo.value.id) {
                        router?.push('/login');
                    } else {
                        resolve(null);
                    }
                });
            });
        },
        logout() {
            router?.push('/login');
        },
    };
};
