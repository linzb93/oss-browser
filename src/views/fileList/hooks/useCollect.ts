import { ref, shallowRef, watch } from 'vue';
import { cloneDeep, omit } from 'lodash-es';
import { ElMessage } from 'element-plus';
import useBreadcrumb from './useBreadcrumb';
import { CollectItem } from '../shared/types';
import * as api from '../api';

export interface FormCollectItem extends CollectItem {
    isEdit: boolean;
}
const list = ref<CollectItem[]>([]);

const formList = ref<FormCollectItem[]>([]);
const visible = shallowRef(false);
export default () => {
    const { fullPath, init: initBreadcrumb } = useBreadcrumb();
    const getList = async () => {
        const data = await api.getCollect();
        list.value = data;
        formList.value = data.map((item) => ({
            ...item,
            isEdit: false,
        }));
    };
    const close = () => {
        visible.value = false;
    };
    return {
        /**
         * 收藏功能初始化。
         */
        init() {
            watch(visible, (vis) => {
                if (!vis) {
                    return;
                }
                getList();
            });
        },
        /**
         * 收藏列表
         */
        list,
        /**
         * 可编辑的，保存完成后会和list同步。
         */
        formList,
        /**
         * 显示收藏弹窗
         */
        visible,
        /**
         * 添加收藏目录
         */
        async add() {
            await api.addCollect({
                path: fullPath.value,
            });
            ElMessage.success('添加成功');
        },
        /**
         * 保存收藏目录
         */
        async save() {
            await api.setCollect(formList.value.map((item) => omit(item, ['isEdit'])));
            list.value = cloneDeep(formList.value);
            ElMessage.success('保存成功');
            visible.value = false;
        },
        /**
         * 删除收藏目录。因为是批量保存，所以删除功能不通过调用接口。
         */
        async deleteItem(target: FormCollectItem) {
            formList.value = formList.value.filter((item) => item.id !== target.id);
        },
        /**
         * 进入目录
         * @param {CollectItem} item - 目录对象
         */
        enter(item: CollectItem) {
            close();
            initBreadcrumb(item.path);
        },
        /**
         * 打开弹窗
         */
        show() {
            visible.value = true;
        },
        /**
         * 关闭弹窗
         */
        close,
    };
};
