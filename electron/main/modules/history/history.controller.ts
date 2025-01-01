import * as historyService from './history.service';
import { IPage } from '../../types/vo';
export default {
    get(dataStr: string) {
        const data = JSON.parse(dataStr) as IPage;
        return historyService.get(data);
    },
};
