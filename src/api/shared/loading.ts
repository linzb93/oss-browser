import { ElLoading } from 'element-plus';

// 当所有请求都解决时，才隐藏loading。
let counter = 0;
let instance: any = null;
export const loading = {
    open(text?: string) {
        counter++;
        if (counter > 0) {
            instance = ElLoading.service({ background: 'transparent', text });
        }
    },
    close() {
        if (counter <= 0) {
            return;
        }
        if (counter > 0) {
            counter--;
        }
        if (counter === 0 && instance && typeof instance.close === 'function') {
            instance.close();
            instance = null;
        }
    },
    isComplete() {
        return counter === 0;
    },
};
