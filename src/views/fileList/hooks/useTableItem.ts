import { ref } from 'vue';
import axios from 'axios';
import { TableItem } from '../shared/types';
import useBreadcrumb from './useBreadcrumb';
import pathUtil from '@/helpers/path';
import { ElMessage } from 'element-plus';
import useTemplate from './useTemplate';
import { requestUtil } from '@/helpers/request';
import { handleMainPost } from '@/helpers/util';
import useTable from './useTable';

const isPic = (item: TableItem) => {
    return ['jpg', 'png', 'jpeg', 'gif', 'webp'].includes(pathUtil.extname(item.name));
};
const isPlainText = (item: TableItem) => {
    return ['txt', 'js', 'ts', 'jsx', 'tsx', 'py', 'json', 'yml', 'yaml'].includes(pathUtil.extname(item.name));
};

const imgPreview = ref({
    /**
     * 控制预览弹窗的显示
     */
    visible: false,
    /**
     * 预览图的网址
     */
    url: '',
    /**
     * 预览弹窗的宽度
     */
    width: 400,
});
const textPreview = ref({
    visible: false,
    content: '',
});
const selected = ref<TableItem[]>([]);
export default () => {
    const { copyTemplate } = useTemplate();
    const { push: pushBreadcrumb } = useBreadcrumb();
    const { getActiveItem } = useTable();
    const clickPath = (item: TableItem) => {
        if (item.size > 0) {
            // 是图片
            if (isPic(item)) {
                imgPreview.value.url = item.url;
                imgPreview.value.visible = true;
                loadImage(item.url);
                return;
            }
            if (isPlainText(item)) {
                axios.get(item.url).then((res) => {
                    textPreview.value = {
                        visible: true,
                        content: res.data,
                    };
                });
            }
            return;
        }
        pushBreadcrumb(item.name);
    };
    const loadImage = (url: string) => {
        const img = new Image();
        img.src = url;
        img.onload = function () {
            const { width: imgWidth, height: imgHeight } = img;
            const { offsetWidth, offsetHeight } = document.body;
            if (imgWidth / offsetWidth > imgHeight / offsetHeight) {
                // 图片较宽
                if (imgWidth <= 400) {
                    imgPreview.value.width = imgWidth;
                } else if (imgWidth > offsetWidth * 0.8) {
                    imgPreview.value.width = offsetWidth * 0.8 + 32;
                } else {
                    imgPreview.value.width = imgWidth + 32;
                }
            } else {
                // 图片较高
                if (imgHeight > offsetHeight * 0.8) {
                    imgPreview.value.width = parseInt((((offsetHeight * 0.8 - 32) * imgWidth) / imgHeight).toString());
                } else {
                    imgPreview.value.width = Math.max(400, imgWidth);
                }
            }
        };
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
        imgPreview,
        textPreview,
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
