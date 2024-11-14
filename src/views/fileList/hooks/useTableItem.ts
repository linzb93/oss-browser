import { shallowRef, ref } from 'vue';
import { TableItem } from '../shared/types';
import useBreadcrumb from './useBreadcrumb';
import pathUtil from '@/helpers/path';
import { ElMessage } from 'element-plus';
import request from '@/api/shared/request';
const isPic = (item: TableItem) => {
    return ['jpg', 'png', 'jpeg', 'gif'].includes(pathUtil.extname(item.name));
};

export default () => {
    const { push: pushBreadcrumb } = useBreadcrumb();
    const previewUrl = shallowRef('');
    const visible = shallowRef(false);
    const selected = ref<TableItem[]>([]);
    return {
        selected,
        previewUrl,
        visible,
        isPic,
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
        handleSelectionChange: (selection: TableItem[]) => {
            selected.value = selection.filter((item) => item.type !== 'dir');
        },
        getStyle(item: TableItem) {
            const img = new Image();
            img.src = item.url;
            img.onload = function () {
                const { width, height } = img;
                request('copy-template', {
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
