import { ref } from 'vue';
import { getSetting as getSettingApi, saveSetting as saveSettingApi } from '@/renderer/api';
import type { SettingInfo } from '@/shared/types';

/**
 * 设置项默认值，与主进程保持一致
 */
const defaultSetting: SettingInfo = {
    pixel: 1,
    previewType: 1,
    copyTemplateId: 0,
    homePath: '',
    deleteSourceFile: false,
    askDeleteSourceFile: true,
};

const setting = ref<SettingInfo>({ ...defaultSetting });

const getSetting = async () => {
    setting.value = await getSettingApi();
};

const saveSetting = async (setting: SettingInfo) => {
    await saveSettingApi(setting);
};

/**
 * 更新部分设置项并保存
 * @param data 需要更新的设置项
 */
const updateSetting = async (data: Partial<SettingInfo>) => {
    const next = { ...setting.value, ...data };
    await saveSettingApi(next);
    setting.value = next;
};

export const useSettingStore = () => {
    return { setting, getSetting, saveSetting, updateSetting };
};
