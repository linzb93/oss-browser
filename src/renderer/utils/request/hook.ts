import { ref } from 'vue';
import { request } from './impl';
import type { Option } from './types';

export function useRequest<T = any>(path: string, params?: any, options?: Option) {
    const loaded = ref(false);
    const result = ref<T>();
    return {
        loaded,
        result,
        async fetch() {
            const res = await request(path, params, options);
            loaded.value = true;
            result.value = res;
        },
    };
}
