import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useOSSStore = defineStore('oss', () => {
    const ossConfig = ref({});
    return { ossConfig };
});
