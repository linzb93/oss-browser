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
                required: true,
                message: '请输入前缀',
            },
            {
                pattern: /^https?\:\/\//,
                message: '请输入正确的前缀',
            },
        ],
    });
    const formRef = ref<FormInstance>();
    const bucketList = ref<any[]>([]);
    const disabled = shallowRef(true);
    const ossValidateProps = ['name', 'region', 'accessKeyId', 'accessKeySecret'];
    const ossInfoSetted = async () => {
        try {
            await formRef.value?.validateField(ossValidateProps);
        } catch (error) {
            return false;
        }
        return true;
    };
    const getBuckets = async (shouldValidate?: boolean) => {
        if (shouldValidate) {
            if (!(await ossInfoSetted())) {
                return;
            }
        }
        disabled.value = false;
        try {
            bucketList.value = await request(
                'get-buckets',
                pick(userInfo.value, ['region', 'accessKeyId', 'accessKeySecret'])
            );
        } catch (error) {
            ElMessage.error('信息输入错误，请重新输入');
            disabled.value = true;
        }
    };
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
            try {
                await doLogin(form.value);
            } catch (error) {
                ElMessage.error('信息输入错误，请重新输入');
                disabled.value = false;
                return;
            }
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
                const data = (await getInfo()) as LoginParams;
                if (data.id) {
                    userInfo.value = data;
                    form.value = data;
                }
                //@ts-ignore
                if (ossValidateProps.every((item) => !!data[item])) {
                    getBuckets(false);
                }
            });
        },
        getBuckets,
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
