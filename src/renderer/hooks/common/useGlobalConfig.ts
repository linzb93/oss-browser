import { ref, computed } from 'vue';
import { getSetting as getSettingApi, saveSetting as saveSettingApi } from '@/renderer/api';
import type { SettingInfo } from '@/shared/types';

const setting = ref<SettingInfo>({} as SettingInfo);

const getSetting = async () => {
    setting.value = await getSettingApi();
};

const saveSetting = async (setting: SettingInfo) => {
    await saveSettingApi(setting);
};

export const useGlobalConfigStore = () => {
    return { setting, getSetting, saveSetting };
};
