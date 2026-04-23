import { ref, computed, onMounted } from 'vue';
import { isEmptyObject } from '@linzb93/utils';
import { AccountItem } from '@/shared/types/account';
import { useSetting } from './useSetting';
import { getAppDefaultId, getAccountList } from '@/renderer/api';

const { homeGetSetting } = useSetting();

const currentAccount = ref<AccountItem>({} as AccountItem);
const formAccount = ref<AccountItem>({} as AccountItem);
const setFormAccount = (account: AccountItem) => {
    formAccount.value = account;
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
        const list = await getAccountList();
        const match = list.find((item) => item.id === defaultAppId);
        if (!match) {
            return;
        }
        currentAccount.value = match;
        homeGetSetting();
    });
};

export const useAccount = () => {
    return {
        currentAccount,
        hasNoAccount,
        formAccount,
        setFormAccount,
        boostrap,
    };
};
