import * as historyService from './history.service';
import { IPage } from '../../types/vo';
export default {
    get(dataStr: string) {
        const data = JSON.parse(dataStr) as IPage;
        return historyService.get(data);
    },
    remove(dataStr: string) {
        const ids = JSON.parse(dataStr) as string[];
        return historyService.remove(ids);
    },
};
