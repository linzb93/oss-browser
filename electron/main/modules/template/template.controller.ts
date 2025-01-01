import * as templateService from './template.service';
import { Database } from '../../types/api';
export default {
    getDetail(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            id: number;
        };
        return templateService.getDetail(data.id);
    },
    getList() {
        return templateService.getList();
    },
    add(dataStr: string) {
        const data = JSON.parse(dataStr) as Database['templates'][number];
        return templateService.add(data);
    },
    edit(dataStr: string) {
        const data = JSON.parse(dataStr) as Database['templates'][number];
        return templateService.edit(data);
    },
    remove(dataStr: string) {
        const data = JSON.parse(dataStr) as Database['templates'][number];
        return templateService.remove(data);
    },
    copy(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            width: number;
            height: number;
            url: string;
        };
        return templateService.copy(data);
    },
};
