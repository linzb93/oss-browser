import { ref } from 'vue';
import { TableItem } from '../shared/types';
import useBreadcrumb from './useBreadcrumb';
import pathUtil from '@/helpers/path';
import { ElMessage } from 'element-plus';
import useTemplate from './useTemplate';
import { requestUtil } from '@/helpers/request';
import { handleMainPost } from '@/helpers/util';
import useTable from './useTable';
import usePreview from './usePreview';

const isPic = (item: TableItem) => {
    return ['jpg', 'png', 'jpeg', 'gif', 'webp'].includes(pathUtil.extname(item.name));
};
// const isPlainText = (item: TableItem) => {
//     return ['txt', 'js', 'ts', 'jsx', 'tsx', 'py', 'json', 'yml', 'yaml'].includes(pathUtil.extname(item.name));
// };
const selected = ref<TableItem[]>([]);
export default () => {
    const { copyTemplate } = useTemplate();
    const { push: pushBreadcrumb } = useBreadcrumb();
    const { getActiveItem } = useTable();
    const { openPreview } = usePreview();
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
         */
        isPic,
        /**
         * 点击文件名称。如果是目录就进入，如果是图片就打开预览图
         */
        clickPath,
        download(item: TableItem) {
            requestUtil.download(item.url);
        },
        /**
         * 读取复制模板，复制图片样式
         */
        getStyle,
    };
};
