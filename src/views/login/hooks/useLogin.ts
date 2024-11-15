import { ref } from 'vue';
import { getInfo } from '@/api/login';
import { Router } from 'vue-router';
const userInfo = ref<{
    id: number | string;
    domain: string;
}>({
    id: '',
    domain: '',
});
export default (router?: Router) => {
    return {
        userInfo,
        checkLogin(): Promise<null> {
            return new Promise((resolve) => {
                getInfo().then((data) => {
                    userInfo.value = data;
                    if (!userInfo.value.id) {
                        router && router.push('/login');
                    } else {
                        resolve(null);
                    }
                });
            });
        },
    };
};
