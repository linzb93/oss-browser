import { ref } from 'vue';
import { AccountItem } from '@/shared/types/account';

const currentAccount = ref<AccountItem>({} as AccountItem);

export const useAccount = () => {
    return {
        currentAccount,
    };
};
