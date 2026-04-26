import { ref, computed } from 'vue';

const breadcrumb = ref<string[]>([]);
const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''));

/**
 * 面包屑状态管理
 */
export const useBreadcrumb = () => {
    /**
     * 返回上一级
     */
    const pop = () => {
        breadcrumb.value.pop();
    };
    return {
        /**
         * 面包屑列表
         */
        breadcrumb,
        /**
         * 面包屑列表拼接的字符串，以"/"收尾
         */
        fullPath,
        /**
         * 设置面包屑
         */
        init(path: string) {
            breadcrumb.value = path.split('/').filter((item) => !!item);
        },
        /**
         * 进入下一级
         * @param {string} name - 下一级的名称
         */
        push(name: string) {
            breadcrumb.value.push(name);
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
        },
    };
};
