import { ref, computed } from 'vue';
export default () => {
    const breadcrumb = ref<string[]>([]);
    const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''));
    return {
        breadcrumb,
        fullPath,
        /**
         * 设置面包屑
         */
        init(path: string) {
            breadcrumb.value = path.split('/').filter((item) => !!item);
        },
        push(item: string) {
            breadcrumb.value.push(item);
        },
        pop() {
            breadcrumb.value.pop();
        },
        set(index: number) {
            breadcrumb.value = breadcrumb.value.slice(0, index + 1);
        },
    };
};
