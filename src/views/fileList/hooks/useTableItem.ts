import { shallowRef, ref } from 'vue';
import { TableItem } from '../shared/types';
import useBreadcrumb from './useBreadcrumb';
import pathUtil from '@/helpers/path';
import { ElMessage } from 'element-plus';
import useTemplate from './useTemplate';
const isPic = (item: TableItem) => {
    return ['jpg', 'png', 'jpeg', 'gif', 'webp'].includes(pathUtil.extname(item.name));
};
const previewUrl = shallowRef('');
const visible = shallowRef(false);
const selected = ref<TableItem[]>([]);
export default () => {
    const { copyTemplate } = useTemplate();
    const { push: pushBreadcrumb } = useBreadcrumb();

    return {
        selected,
        /**
         * 预览图的网址
         */
        previewUrl,
        /**
         * 控制预览弹窗的显示
         */
        visible,
        /**
         * 根据文件后缀名判断是否是图片
         */
        isPic,
        /**
         * 点击文件名称。如果是文件夹就进入，如果是图片就打开预览图
         */
        clickPath(item: TableItem) {
            if (item.size > 0) {
                // 是图片
                if (isPic(item)) {
                    previewUrl.value = item.url;
                    visible.value = true;
                }
                return;
            }
            pushBreadcrumb(item.name);
        },
        /**
         * 读取复制模板，复制图片样式
         */
        getStyle(item: TableItem) {
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
        },
    };
};
