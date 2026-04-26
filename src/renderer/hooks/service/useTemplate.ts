import { computed, ref } from 'vue';
import {
    getTemplateItem,
    getTemplateList,
    addTemplateItem,
    editTemplateItem,
    removeTemplateItem,
    copyTemplate,
} from '@/renderer/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { TemplateItem } from '@/shared/types';
import { useGlobalConfigStore } from '@/renderer/hooks/common/useGlobalConfig';
const { setting } = useGlobalConfigStore();

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
 * 模板操作钩子
 */
export const useTemplate = () => {
    /**
     * 根据 ID 获取模板项
     * @param {object} data - 数据对象包含 ID
     * @param {number} data.id - 模板项 ID
     */
    async function getItem(data: { id: number }) {
        form.value = await getTemplateItem(data);
    }
    /**
     * 添加模板项
     */
    async function addItem() {
        await addTemplateItem(form.value);
        ElMessage.success('添加成功');
    }
    /**
     * 编辑模板项
     */
    async function editItem() {
        await editTemplateItem(form.value);
        ElMessage.success('编辑成功');
    }
    const currentTemplate = ref<TemplateItem>({} as TemplateItem);
    /**
     * 关闭抽屉
     */
    function close() {
        visible.value = false;
    }
    const getCurrentTemplate = async () => {
        if (!setting.value.copyTemplateId) {
            return;
        }
        currentTemplate.value = await getTemplateItem({ id: setting.value.copyTemplateId });
    };
    /**
     * 处理抽屉关闭事件
     */
    function closed() {
        form.value = {
            id: 0,
            name: '',
            content: '',
        };
    }
    /**
     * 获取模板列表
     */
    async function getList() {
        templates.value = await getTemplateList();
    }
    return {
        visible,
        templates,
        form,
        isEditMode,
        getList,
        /**
         * 打开抽屉
         * @param {TemplateItemPure} [item] - 要编辑的模板项
         */
        openDialog(item?: TemplateItemPure) {
            visible.value = true;
            if (item) {
                getItem(item);
            }
        },
        hasTemplate: computed(() => templates.value.length > 0),
        getCurrentTemplate,
        currentTemplate,
        addItem,
        editItem,
        /**
         * 保存操作（添加或编辑）
         */
        async saveAction() {
            if (form.value.id) {
                return editItem();
            } else {
                return addItem();
            }
        },
        /**
         * 删除模板项
         * @param {Pick<TemplateItem, 'id'>} item - 要删除的模板项
         */
        removeItem(item: Pick<TemplateItem, 'id'>) {
            ElMessageBox.confirm('确认删除？', '温馨提醒', {
                confirmButtonText: '删除',
            })
                .then(() => {
                    return removeTemplateItem({
                        id: item.id,
                    });
                })
                .then(() => {
                    ElMessage.success('删除成功');
                    getList();
                });
        },
        /**
         * 调用 复制样式模板
         * @param {object} data - The data object
         * @param {number} data.width - Image width
         * @param {number} data.height - Image height
         * @param {string} data.url - Image URL
         */
        async copyTemplate(data: { width: number; height: number; url: string }) {
            return await copyTemplate({
                width: data.width,
                height: data.height,
                url: data.url,
            });
        },
        close,
        closed,
    };
};
