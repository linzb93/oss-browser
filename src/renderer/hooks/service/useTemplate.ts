import { computed, ref } from 'vue';
import * as api from '@/renderer/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { TemplateItem } from '@/shared/types';
type TemplateItemPure = Omit<TemplateItem, 'content'>;
const templates = ref<TemplateItemPure[]>([]);
const visible = ref(false);

const form = ref<TemplateItem>({
    id: 0,
    name: '',
    content: '',
});
const isEditMode = ref(false);
/**
 * Hook for template operations
 * @returns {object} The hook object
 */
export default () => {
    /**
     * Get template item by id
     * @param {object} data - The data object containing id
     * @param {number} data.id - The template item id
     */
    async function getItem(data: { id: number }) {
        form.value = await api.getTemplateItem(data);
    }
    /**
     * Add a new template item
     */
    async function addItem() {
        await api.addTemplateItem(form.value);
        ElMessage.success('添加成功');
    }
    /**
     * Edit an existing template item
     */
    async function editItem() {
        await api.editTemplateItem(form.value);
        ElMessage.success('编辑成功');
    }
    /**
     * Close the dialog
     */
    function close() {
        visible.value = false;
    }
    /**
     * Handle dialog closed event
     */
    function closed() {
        form.value = {
            id: 0,
            name: '',
            content: '',
        };
    }
    /**
     * Get template list
     */
    async function getList() {
        templates.value = await api.getTemplateList();
    }
    return {
        visible,
        templates,
        form,
        isEditMode,
        getList,
        /**
         * Open the dialog
         * @param {TemplateItemPure} [item] - The template item to edit
         */
        openDialog(item?: TemplateItemPure) {
            visible.value = true;
            if (item) {
                getItem(item);
            }
        },
        hasTemplate: computed(() => templates.value.length > 0),
        addItem,
        editItem,
        /**
         * Save action (add or edit)
         */
        async saveAction() {
            if (form.value.id) {
                return editItem();
            } else {
                return addItem();
            }
        },
        /**
         * Remove a template item
         * @param {Pick<TemplateItem, 'id'>} item - The item to remove
         */
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
                    getList();
                });
        },
        /**
         * 调用复制样式模板
         * @param {object} data - The data object
         * @param {number} data.width - Image width
         * @param {number} data.height - Image height
         * @param {string} data.url - Image URL
         */
        async copyTemplate(data: { width: number; height: number; url: string }) {
            return await api.copyTemplate({
                width: data.width,
                height: data.height,
                url: data.url,
            });
        },
        close,
        closed,
    };
};
