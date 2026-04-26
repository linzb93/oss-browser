import { ref, computed } from 'vue';
import { getCurrentAccount, getSetting as getSettingApi, saveSetting as saveSettingApi } from '@/renderer/api';
import type { AccountItem, SettingInfo, TemplateItem } from '@/shared/types';

const setting = ref<SettingInfo>({} as SettingInfo);
const currentAccount = ref<AccountItem>({} as AccountItem);

const loadCurrentAccount = async () => {
    currentAccount.value = await getCurrentAccount();
};
const hasNoAccount = computed(() => {
    return !currentAccount.value.id;
});

const getSetting = async () => {
    setting.value = await getSettingApi();
};

const saveSetting = async (setting: SettingInfo) => {
    await saveSettingApi(setting);
};

export const useGlobalConfigStore = () => {
    return { setting, currentAccount, loadCurrentAccount, hasNoAccount, getSetting, saveSetting };
};
