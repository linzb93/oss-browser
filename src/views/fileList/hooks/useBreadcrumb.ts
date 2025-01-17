import { ref, computed } from 'vue';
import { handleMainPost } from '@/helpers/util';

const breadcrumb = ref<string[]>([]);
const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''));
/**
 * 当面包屑变化时，触发的回调函数
 */
let onChangeCallback: Function = () => {};

export default () => {
    const pop = () => {
        breadcrumb.value.pop();
        onChangeCallback();
    };
    return {
        /**
         * 面包屑列表
         */
        breadcrumb,
        /**
         * 面包屑列表拼接的字符串，以”/“收尾
         */
        fullPath,
        /**
         * 设置面包屑
         */
        init(path: string) {
            breadcrumb.value = path.split('/').filter((item) => !!item);
            onChangeCallback();
            handleMainPost('back', () => {
                pop();
            });
        },
        /**
         * 进入下一级
         * @param {string} name - 下一级的名称
         */
        push(name: string) {
            breadcrumb.value.push(name);
            onChangeCallback();
        },
        /**
         * 返回上一级
         */
        pop,
        /**
         * 点击面包屑的某一级
         */
        set(index: number) {
            breadcrumb.value = breadcrumb.value.slice(0, index + 1);
            onChangeCallback();
        },
        /**
         * 当面包屑变化时，触发的回调函数
         * @param {Function} fn - 回调函数
         */
        onChange(fn: Function) {
            onChangeCallback = fn;
        },
    };
};
