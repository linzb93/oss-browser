import * as accountService from './account.service';
import { Database } from '../../types/api';
export default {
    get() {
        return accountService.get();
    },
    save(dataStr: string) {
        const data = JSON.parse(dataStr) as Database['account'];
        return accountService.save(data);
    },
};
