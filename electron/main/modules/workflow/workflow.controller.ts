import * as workflowService from './workflow.service';
import { Database } from '../../types/api';
export default {
    getList() {
        return workflowService.getList();
    },
    add(dataStr: string) {
        const data = JSON.parse(dataStr) as Omit<Database['workflow'], 'id'>;
        return workflowService.add(data);
    },
    edit(dataStr: string) {
        const data = JSON.parse(dataStr) as Database['workflow'];
        return workflowService.edit(data);
    },
    remove(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            id: number;
        };
        return workflowService.remove(data.id);
    },
};
