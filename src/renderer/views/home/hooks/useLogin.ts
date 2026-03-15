import { ref, readonly, shallowRef, watch } from 'vue';
import request from '@/renderer/helpers/request';
import { cloneDeep, pick } from 'lodash-es';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import type { LoginParams } from '@/shared/types';

const doLogin = async (params: LoginParams) => {
    await request('account:save', params);
};

const getInfo = async (id: number): Promise<LoginParams> => {
    return await request('account:get-item', { id });
};

const userInfo = ref<LoginParams>({
    id: 0,
    domain: '',
    platform: 1,
    name: '',
    region: '',
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
});
const visible = shallowRef(false);
const form = ref<LoginParams>({
    id: 0,
    domain: '',
    platform: 1,
    name: '',
    region: '',
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
});
export default () => {
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
                'oss:get-buckets',
                pick(form.value, ['region', 'accessKeyId', 'accessKeySecret']),
            );
        } catch (error) {
            ElMessage.error('信息输入错误，请重新输入');
            disabled.value = true;
        }
    };
    const close = () => {
        visible.value = false;
    };
    return {
        userInfo,
        form,
        rules,
        formRef,
        bucketList,
        disabled,
        visible,
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
                message: form.value.id ? '编辑成功' : '添加成功',
                duration: 1500,
            });
            close();
        },
        async initialDialogFormData() {
            if (!form.value.id) {
                return;
            }
            const data = (await getInfo(form.value.id)) as LoginParams;
            if (data.id) {
                userInfo.value = data;
                form.value = data;
            }
            if (ossValidateProps.every((item) => !!data[item as keyof LoginParams])) {
                getBuckets(false);
            }
        },
        getUserInfo(id: string) {
            getInfo(Number(id)).then((res) => {
                userInfo.value = res;
            });
        },
        getBuckets,
        close,
        closed() {
            form.value = {
                id: 0,
                domain: '',
                platform: 1,
                name: '',
                region: '',
                accessKeyId: '',
                accessKeySecret: '',
                bucket: '',
            };
            bucketList.value = [];
            formRef.value?.resetFields();
        },
    };
};
