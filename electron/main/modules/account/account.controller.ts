import * as accountService from './account.service';
import { Database } from '../../types/api';
export default {
    getList() {
        return accountService.getList();
    },
    getItem(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            id: number;
        };
        return accountService.getItem(data.id);
    },
    save(dataStr: string) {
        const data = JSON.parse(dataStr) as Database['accounts'][number];
        return accountService.save(data);
    },
    getDefaultAppId() {
        return accountService.getDefaultAppId();
    },
    setDefaultAppId(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            id: number;
        };
        return accountService.setDefaultAppId(data.id);
    },
};
