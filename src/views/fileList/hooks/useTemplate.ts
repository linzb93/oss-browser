import { ref, shallowRef, watch } from 'vue';
import request from '@/helpers/request';
import { ElMessage, ElMessageBox } from 'element-plus';

interface TemplateItem {
    id: number;
    name: string;
    content: string;
}

const templates = ref<TemplateItem[]>([]);
const visible = shallowRef(false);
export default () => {
    const currentItem = ref<TemplateItem>({
        id: 1,
        name: '',
        content: '',
    });
    async function getItem(data: { id: number }) {
        return await request('get-template', data);
    }
    async function addItem() {
        await request('add-template', currentItem.value);
        ElMessage.success('添加成功');
    }
    async function editItem() {
        await request('edit-template', currentItem.value);
        ElMessage.success('编辑成功');
    }
    function close() {
        visible.value = false;
    }
    return {
        visible,
        templates,
        currentItem,
        init() {
            watch(visible, (vis) => {
                if (!vis) {
                    return;
                }
                getItem(currentItem.value);
            });
        },
        async getList() {
            templates.value = await request('get-template-list');
        },
        getItem,
        async openDialog(item?: TemplateItem) {
            visible.value = true;
            if (item) {
                currentItem.value = item;
            }
        },
        addItem,
        editItem,
        async save() {
            const action = () => {
                if (currentItem.value.id) {
                    return editItem();
                } else {
                    return addItem();
                }
            };
            action().then(() => {
                close();
            });
        },
        removeItem(item: TemplateItem) {
            ElMessageBox.confirm('确认删除？', '温馨提醒', {
                confirmButtonText: '删除',
            })
                .then(() => {
                    return request('remove-template', {
                        id: item.id,
                    });
                })
                .then(() => {
                    ElMessage.success('删除成功');
                });
        },
        /**
         * 调用复制样式模板
         */
        async copyTemplate(data: { width: number; height: number; url: string }) {
            return await request('copy-template', {
                width: data.height,
                height: data.height,
                url: data.url,
            });
        },
        close,
    };
};
