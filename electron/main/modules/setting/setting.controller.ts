import * as settingService from './setting.service';
import { Database } from '../../types/api';
export default {
    get() {
        return settingService.get();
    },
    set(dataStr: string) {
        const data = JSON.parse(dataStr) as Database['setting'];
        return settingService.set(data);
    },
    setHome(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            path: string;
        };
        return settingService.setHome(data.path);
    },
};
