import { ref, computed } from 'vue';
import { getCurrentAccount, getSetting as getSettingApi, getTemplateItem } from '@/renderer/api';
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
const currentTemplate = ref<TemplateItem>({} as TemplateItem);
const hasTemplate = computed(() => {
    return setting.value.copyTemplateId !== 0;
});
const getCurrentTemplate = async () => {
    if (!setting.value.copyTemplateId) {
        return;
    }
    currentTemplate.value = await getTemplateItem({ id: setting.value.copyTemplateId });
};

export const useGlobalConfigStore = () => {
    return { setting, currentAccount, loadCurrentAccount, hasNoAccount, getSetting, hasTemplate, getCurrentTemplate };
};
