import { ref, shallowRef, watch } from 'vue';
import * as api from '../api';
import useBreadcrumb from './useBreadcrumb';
import { SettingInfo } from '../shared/types';
import { cloneDeep } from 'lodash-es';
import useTable from './useTable';
import { ElMessage } from 'element-plus';
const visible = shallowRef(false);
const setting = ref<SettingInfo>({
    pixel: 2,
    previewType: 1,
    homePath: '',
    copyTemplateId: 0,
});
const formSetting = ref<SettingInfo>({
    pixel: 2,
    previewType: 1,
    homePath: '',
    copyTemplateId: 0,
});
export default () => {
    const { init: initBreadcrumb, fullPath } = useBreadcrumb();
    const { getList } = useTable();
    const close = () => {
        visible.value = false;
    };
    async function getSetting() {
        const data = await api.getSetting();
        setting.value = {
            ...setting.value,
            ...data,
        };
        formSetting.value = {
            ...setting.value,
            ...data,
        };
    }
    return {
        setting,
        /**
         * 可编辑的设置，保存后会和同步至setting
         */
        formSetting,
        visible,
        init(callback: Function) {
            watch(visible, (vis) => {
                if (!vis) {
                    return;
                }
                formSetting.value = cloneDeep(setting.value);
                callback();
            });
        },
        getSetting,
        async homeGetSetting() {
            await getSetting();
            if (setting.value.homePath) {
                initBreadcrumb(setting.value.homePath);
            } else {
                getList(false);
            }
        },
        saveSetting() {
            return new Promise((resolve) => {
                api.saveSetting(formSetting.value).then(() => {
                    ElMessage.success({
                        message: '保存成功',
                        onClose: () => {
                            close();
                            resolve(null);
                        },
                    });
                });
            });
        },
        /**
         * 设置首页地址
         */
        async setHome() {
            await api.setHome({
                path: fullPath.value.replace(/\/$/, ''),
            });
            ElMessage.success('设置成功');
        },
        /**
         * 打开设置弹窗
         */
        show() {
            visible.value = true;
        },
        /**
         * 关闭设置弹窗
         */
        close,
    };
};
