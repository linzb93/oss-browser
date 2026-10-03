import { request } from './impl';
import { ElMessage } from 'element-plus';
export const requestActions = {
    /**
     * 复制文本
     * @param {string} text 复制的文本
     */
    copy(text: string) {
        request('util:copy', {
            content: text,
        });
        ElMessage.success('复制成功');
    },

    /**
     * 打开网站或者文件
     * @param url 网址或者本地文件地址
     */
    open(type: 'vscode' | 'path' | 'web', url: string) {
        request('util:open', {
            type,
            url,
        });
    },
};
