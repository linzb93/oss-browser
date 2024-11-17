import { ref, shallowRef, watch } from 'vue';
import request from '@/helpers/request';
import { cloneDeep, omit } from 'lodash-es';
import { ElMessage } from 'element-plus';
import useBreadcrumb from './useBreadcrumb';
interface CollectItem {
    id: string;
    name: string;
    path: string;
}

export interface FormCollectItem extends CollectItem {
    isEdit: boolean;
}

export default () => {
    const list = ref<CollectItem[]>([]);
    const formList = ref<FormCollectItem[]>([]);
    const visible = shallowRef(false);
    const { fullPath, init: initBreadcrumb } = useBreadcrumb();
    const getList = async () => {
        const data: CollectItem[] = await request('get-collect');
        list.value = data;
        formList.value = data.map((item) => ({
            ...item,
            isEdit: false,
        }));
    };
    return {
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
         * 用来编辑用的收藏列表
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
            await request('add-collect', {
                path: fullPath.value,
            });
            ElMessage.success('添加成功');
        },
        /**
         * 保存收藏目录
         */
        async save() {
            await request(
                'set-collect',
                formList.value.map((item) => omit(item, ['isEdit']))
            );
            list.value = cloneDeep(formList.value);
            ElMessage.success('保存成功');
            visible.value = false;
        },
        /**
         * 删除收藏目录。因为是批量保存，所以删除功能不通过接口。
         */
        async deleteItem(target: FormCollectItem) {
            formList.value = formList.value.filter((item) => item.id !== target.id);
        },
        enter(target: CollectItem) {
            this.close();
            initBreadcrumb(target.path);
        },
        close() {
            visible.value = false;
        },
        show() {
            visible.value = true;
        },
    };
};
