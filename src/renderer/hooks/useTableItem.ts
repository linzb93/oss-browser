import { ref } from 'vue';
import { TableItem } from '@/renderer/types';
import useBreadcrumb from '@/renderer/hooks/useBreadcrumb';
import pathUtil from '@/renderer/helpers/path';
import { ElMessage } from 'element-plus';
import useTemplate from '@/renderer/hooks/useTemplate';
import { requestUtil } from '@/renderer/helpers/request';
import { handleMainPost } from '@/renderer/helpers/util';
import useTable from '@/renderer/hooks/useTable';
import usePreview from '@/renderer/hooks/usePreview';

/**
 * Check if the file is a picture
 * @param {TableItem} item - The file item
 * @returns {boolean} True if the file is a picture
 */
const isPic = (item: TableItem) => {
    return ['jpg', 'png', 'jpeg', 'gif', 'webp'].includes(pathUtil.extname(item.name));
};
// const isPlainText = (item: TableItem) => {
//     return ['txt', 'js', 'ts', 'jsx', 'tsx', 'py', 'json', 'yml', 'yaml'].includes(pathUtil.extname(item.name));
// };
const selected = ref<TableItem[]>([]);
/**
 * Hook for table item operations
 * @returns {object} The hook object
 */
export default () => {
    const { copyTemplate } = useTemplate();
    const { push: pushBreadcrumb } = useBreadcrumb();
    const { getActiveItem } = useTable();
    const { openPreview } = usePreview();
    /**
     * Handle path click event
     * @param {TableItem} item - The file item
     */
    const clickPath = (item: TableItem) => {
        if (item.size > 0) {
            const url = item.url;
            // 是图片
            if (isPic(item)) {
                openPreview(item.url);
                return;
            }
            return;
        }
        pushBreadcrumb(item.name);
    };

    /**
     * Get image style and copy template
     * @param {TableItem} item - The file item
     */
    const getStyle = (item: TableItem) => {
        const img = new Image();
        img.src = item.url;
        img.onload = function () {
            const { width, height } = img;
            copyTemplate({
                width,
                height,
                url: item.url,
            })
                .then(() => {
                    ElMessage.success('复制成功');
                })
                .catch((e) => {
                    ElMessage.error(e.message);
                });
        };
    };
    return {
        selected,
        /**
         * Initialize the hook
         */
        init() {
            handleMainPost('enter', () => {
                const item = getActiveItem();
                if (item) {
                    clickPath(item);
                }
            });
            handleMainPost('copy-style', () => {
                const item = getActiveItem();
                if (item) {
                    getStyle(item);
                }
            });
        },
        /**
         * 根据文件后缀名判断是否是图片
         * @param {TableItem} item - The file item
         * @returns {boolean} True if the file is a picture
         */
        isPic,
        /**
         * 点击文件名称。如果是目录就进入，如果是图片就打开预览图
         * @param {TableItem} item - The file item
         */
        clickPath,
        /**
         * Download file
         * @param {TableItem} item - The file item
         */
        download(item: TableItem) {
            requestUtil.download(item.url);
        },
        /**
         * 读取复制模板，复制图片样式
         * @param {TableItem} item - The file item
         */
        getStyle,
    };
};
