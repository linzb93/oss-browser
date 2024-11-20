import { ref, computed } from 'vue';

/**
 * 面包屑列表
 */
const breadcrumb = ref<string[]>([]);
let onChangeCallback: Function = () => {};
/**
 * 面包屑列表拼接的字符串
 */
const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''));
export default () => {
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
        onChange(fn: Function) {
            onChangeCallback = fn;
            console.log(onChangeCallback);
        },
    };
};
