import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { TableItem } from '@/shared/types';
import { ElMessageBox, ElMessage } from 'element-plus';
import { getOSSList as apiGetOSSList, addDirectory } from '@/renderer/api';

export const useOSSStore = defineStore('oss', () => {
    const ossList = ref<TableItem[]>([]);

    const getOSSList = (isConcat: boolean = true) => apiGetOSSList({ prefix: '', useToken: false });

    const breadcrumb = ref<string[]>([]);
    const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''));

    const createDirectory = () => {
        ElMessageBox.prompt('请输入目录名称', '温馨提醒', {
            confirmButtonText: '创建',
            beforeClose: (action, instance, done) => {
                if (action !== 'confirm') {
                    done();
                    return;
                }
                if (!instance.inputValue) {
                    ElMessage.error('请输入目录名称');
                    return;
                }
                done();
            },
        })
            .then(async ({ value }) => {
                if (ossList.value.some((file) => file.type === 'dir' && file.name === value)) {
                    ElMessage.warning('存在同名目录，无需创建');
                    return;
                }
                await addDirectory({
                    prefix: fullPath.value,
                    names: value,
                    type: 'directory',
                });
                ElMessage.success('创建成功');
                getOSSList(false);
            })
            .catch(() => {
                //
            });
    };
    return { ossList, getOSSList, createDirectory, fullPath, breadcrumb };
});
