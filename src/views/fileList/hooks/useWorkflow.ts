import { shallowRef, ref, computed } from 'vue';
import { WorkflowItem } from '../shared/types';
import * as api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';

const visible = shallowRef(false);
const isEditMode = shallowRef(false);
const list = ref<WorkflowItem[]>([]);
const form = ref<WorkflowItem>({
    id: 0,
    name: '',
    nameType: 'originName',
    templateContent: '',
    templateType: 'plainText',
});
export default () => {
    async function getItem(data: { id: number }) {
        form.value = await api.getWorkflowItem(data);
    }
    async function addItem() {
        console.log(form.value);
        await api.addWorkflowItem(form.value);
        ElMessage.success('添加成功');
    }
    async function editItem() {
        await api.editWorkflowItem(form.value);
        ElMessage.success('编辑成功');
    }
    function close() {
        visible.value = false;
    }
    function closed() {
        form.value = {
            id: 0,
            name: '',
            nameType: 'originName',
            templateContent: '',
            templateType: 'plainText',
        };
    }
    async function getList() {
        list.value = await api.getWorkflowList();
    }
    return {
        visible,
        list,
        form,
        isEditMode,
        getList,
        close,
        closed,
        openDialog(item?: WorkflowItem) {
            visible.value = true;
            if (item) {
                getItem(item);
            }
        },
        hasWorkflow: computed(() => list.value.length > 0),
        addItem,
        editItem,
        async saveAction() {
            if (form.value.id) {
                return editItem();
            } else {
                return addItem();
            }
        },
        removeItem(item: Pick<WorkflowItem, 'id'>) {
            ElMessageBox.confirm('确认删除？', '温馨提醒', {
                confirmButtonText: '删除',
            })
                .then(() => {
                    return api.removeWorkflowItem({
                        id: item.id,
                    });
                })
                .then(() => {
                    ElMessage.success('删除成功');
                    getList();
                });
        },
    };
};
