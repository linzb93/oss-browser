import { ref, shallowRef } from 'vue';
import * as api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { TemplateItem } from '../shared/types';
type TemplateItemPure = Omit<TemplateItem, 'content'>;
const templates = ref<TemplateItemPure[]>([]);
const visible = shallowRef(false);
const form = ref<TemplateItem>({
    id: 0,
    name: '',
    content: '',
});
export default () => {
    async function getItem(data: { id: number }) {
        form.value = await api.getTemplateItem(data);
    }
    async function addItem() {
        await api.addTemplateItem(form.value);
        ElMessage.success('添加成功');
    }
    async function editItem() {
        await api.editTemplateItem(form.value);
        ElMessage.success('编辑成功');
    }
    function close() {
        visible.value = false;
    }
    return {
        visible,
        templates,
        form,
        async getList() {
            templates.value = await api.getTemplateList();
        },
        async openDialog(item?: TemplateItemPure) {
            visible.value = true;
            if (item) {
                getItem(item);
            }
        },
        addItem,
        editItem,
        async save() {
            const action = () => {
                if (form.value.id) {
                    return editItem();
                } else {
                    return addItem();
                }
            };
            action().then(() => {
                close();
            });
        },
        removeItem(item: Pick<TemplateItem, 'id'>) {
            ElMessageBox.confirm('确认删除？', '温馨提醒', {
                confirmButtonText: '删除',
            })
                .then(() => {
                    return api.removeTemplateItem({
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
            return await api.copyTemplate({
                width: data.height,
                height: data.height,
                url: data.url,
            });
        },
        close,
    };
};
