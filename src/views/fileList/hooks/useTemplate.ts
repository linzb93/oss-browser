import { ref, shallowRef, watch } from 'vue';
import request from '@/helpers/request';
import { ElMessage, ElMessageBox } from 'element-plus';

interface TemplateItem {
    id: number;
    name: string;
    content: string;
}

const getTemplate = async (data: { id: number }): Promise<TemplateItem[]> => {
    return await request('get-template', data);
};

const addTemplate = async (data: Omit<TemplateItem, 'id'>) => {
    return await request('add-template', data);
};

const editTemplate = async (data: TemplateItem) => {
    return await request('edit-template', data);
};
const removeTemplate = async (data: { id: number }) => {
    return await request('remove-template', data);
};

const templates = ref<TemplateItem[]>([]);

export default () => {
    const visible = shallowRef(false);
    const currentItem = ref<TemplateItem>({
        id: 1,
        name: '',
        content: '',
    });
    return {
        visible,
        templates,
        currentItem,
        init() {
            watch(visible, (vis) => {
                if (!vis) {
                    return;
                }
                this.getItem(currentItem.value);
            });
        },
        async getList() {
            templates.value = await request('get-template-list');
        },
        async getItem(data: { id: number }) {
            return await request('get-template', data);
        },
        async openDialog(item?: TemplateItem) {
            visible.value = true;
            if (item) {
                currentItem.value = item;
            }
        },
        async addItem() {
            await request('add-template', currentItem.value);
            ElMessage.success('添加成功');
        },
        async editItem() {
            await request('edit-template', currentItem.value);
            ElMessage.success('编辑成功');
        },
        async save() {
            const action = () => {
                if (currentItem.value.id) {
                    return this.editItem();
                } else {
                    return this.addItem();
                }
            };
            action().then(() => {
                this.close();
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
        async copyTemplate(data: { width: number; height: number; url: string }) {
            return await request('copy-template', {
                width: data.height,
                height: data.height,
                url: data.url,
            });
        },
        close() {
            visible.value = false;
        },
    };
};
