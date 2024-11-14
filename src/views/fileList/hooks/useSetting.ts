import { ref } from 'vue';
import request from '@/api/shared/request';
import useBreadcrumb from './useBreadcrumb';
import { SettingInfo } from '../shared/types';
import useTable from './useTable';
import { ElMessage } from 'element-plus';
export default () => {
    const setting = ref<SettingInfo>({
        pixel: 2,
        previewType: 1,
        homePath: '',
        copyTemplateId: 0,
    });
    const { init: initBreadcrumb } = useBreadcrumb();
    const { getList } = useTable();
    return {
        async getSetting() {
            const data = await request('get-setting');
            setting.value = {
                ...setting.value,
                ...data,
            };
            if (setting.value.homePath) {
                initBreadcrumb(setting.value.homePath);
            } else {
                getList(false);
            }
        },
        async saveSetting(data: any) {
            await request('save-setting', data);
            ElMessage.success({
                message: '保存成功',
                onClose: () => {
                    // emit('submit', data);
                    close();
                },
            });
        },
    };
};
