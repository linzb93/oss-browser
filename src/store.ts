import { defineStore } from 'pinia';

interface PlatformInfo {
    domain: string;
}

export const useOssStore = defineStore('oss', {
    state: () => {
        return {
            platform: {},
        } as {
            platform: PlatformInfo;
        };
    },
    actions: {
        savePlatform(payload: PlatformInfo) {
            this.platform = payload;
        },
    },
});
