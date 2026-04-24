import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { getCurrentAccount } from '@/renderer/api';
import type { AccountItem } from '@/shared/types';
export const useGlobalConfigStore = defineStore('globalConfig', () => {
    const globalConfig = ref({});
    const currentAccount = ref<AccountItem>({} as AccountItem);

    const loadCurrentAccount = async () => {
        currentAccount.value = await getCurrentAccount();
    };
    const hasNoAccount = computed(() => {
        return !currentAccount.value.id;
    });
    return { globalConfig, currentAccount, loadCurrentAccount, hasNoAccount };
});
