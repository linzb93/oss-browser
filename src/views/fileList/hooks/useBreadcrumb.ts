import { ref, computed } from 'vue';
import useTable from './useTable';

/**
 * 面包屑列表
 */
const breadcrumb = ref<string[]>([]);

const { getList } = useTable();
export default () => {
    /**
     * 面包屑列表拼接的字符串
     */
    const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''));
    let onChangeCallback = () => {
        getList(false);
    };
    return {
        breadcrumb,
        fullPath,
        /**
         * 设置面包屑
         */
        init(path: string) {
            breadcrumb.value = path.split('/').filter((item) => !!item);
            onChangeCallback();
        },
        push(item: string) {
            breadcrumb.value.push(item);
            onChangeCallback();
        },
        pop() {
            breadcrumb.value.pop();
            onChangeCallback();
        },
        /**
         * 点击面包屑的某一级
         */
        set(index: number) {
            breadcrumb.value = breadcrumb.value.slice(0, index + 1);
            onChangeCallback();
        },
    };
};
