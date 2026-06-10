import { ref, computed, onMounted } from 'vue';
import { isEmptyObject } from '@linzb93/utils';
import { AccountItem } from '@/shared/types/account';
import { useGlobalConfigStore } from '../common/useGlobalConfig';
import {
    getAppDefaultId,
    getCurrentAccount,
    getAccountList as getAccountListApi,
    setAppDefaultId,
    saveAccount as saveAccountApi,
} from '@/renderer/api';

const { getSetting } = useGlobalConfigStore();

const currentAccount = ref<AccountItem>({} as AccountItem);
const formAccount = ref<AccountItem>({} as AccountItem);
const setFormAccount = (account: AccountItem) => {
    formAccount.value = account;
};
const setCurrentAccount = (account: AccountItem) => {
    currentAccount.value = account;
    setAppDefaultId({ id: account.id });
};
const loadCurrentAccount = async () => {
    currentAccount.value = await getCurrentAccount();
};
const hasNoAccount = computed(() => isEmptyObject(currentAccount.value));
/**
 * 初始化应用
 */
const boostrap = () => {
    onMounted(async () => {
        const defaultAppId = await getAppDefaultId();
        if (!defaultAppId) {
            return;
        }
        const list = await getAccountListApi();
        const match = list.find((item) => item.id === defaultAppId);
        if (!match) {
            return;
        }
        currentAccount.value = match;
        getSetting();
    });
};
const accountList = ref<AccountItem[]>([]);
const getAccountList = async () => {
    accountList.value = (await getAccountListApi()) || [];
};
const saveAccount = async (account: AccountItem) => {
    await saveAccountApi(account);
};

export const useAccount = () => {
    return {
        currentAccount,
        hasNoAccount,
        formAccount,
        setFormAccount,
        setCurrentAccount,
        boostrap,
        loadCurrentAccount,
        accountList,
        getAccountList,
        saveAccount,
    };
};
