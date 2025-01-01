import * as collectService from './collect.service';
import { Database } from '../../types/api';
export default {
    get() {
        return collectService.get();
    },
    add(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            path: string;
        };
        return collectService.add(data.path);
    },
    set(dataStr: string) {
        const data = JSON.parse(dataStr) as Database['collect'];
        return collectService.set(data);
    },
};
