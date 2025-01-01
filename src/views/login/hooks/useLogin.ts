import { ref, readonly, onMounted, shallowRef } from 'vue';
import request from '@/helpers/request';
import { Router } from 'vue-router';
import { cloneDeep, pick } from 'lodash-es';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
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
    const rules = readonly<FormRules>({
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
            message: '请输入bucket',
        },
        domain: [
            {
                pattern: /^https?\:\/\//,
                message: '请输入正确的前缀',
            },
        ],
    });
    const formRef = ref<FormInstance>();
    const bucketList = ref<any[]>([]);
    const disabled = shallowRef(true);
    return {
        userInfo,
        form,
        rules,
        formRef,
        bucketList,
        disabled,
        async login() {
            try {
                await formRef.value?.validate();
            } catch (error) {
                return;
            }
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
        async getBuckets() {
            try {
                await formRef.value?.validateField(['name', 'region', 'accessKeyId', 'accessKeySecret']);
            } catch (error) {
                return;
            }
            disabled.value = false;
            try {
                bucketList.value = await request(
                    'get-buckets',
                    pick(form.value, ['region', 'accessKeyId', 'accessKeySecret'])
                );
            } catch (error) {
                ElMessage.error('信息输入错误，请重新输入');
                disabled.value = true;
            }
        },
        logout() {
            router?.push('/login');
        },
    };
};
