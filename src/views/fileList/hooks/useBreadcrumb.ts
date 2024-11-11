import { ref, computed } from 'vue';

type changeCallback = () => void;

export default () => {
    const breadcrumb = ref<string[]>([]);
    const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''));
    let onChangeCallback: changeCallback = () => {};
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
        onChange(cb: changeCallback) {
            onChangeCallback = cb;
        },
    };
};
