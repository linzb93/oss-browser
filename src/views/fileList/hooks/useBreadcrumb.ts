import { ref, computed } from 'vue';
import useTable from './useTable';
type changeCallback = () => void;
const breadcrumb = ref<string[]>([]);
const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''));
export default () => {
    const { getList } = useTable();
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
        set(index: number) {
            breadcrumb.value = breadcrumb.value.slice(0, index + 1);
            onChangeCallback();
        },
    };
};
