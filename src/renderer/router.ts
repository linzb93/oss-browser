import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        component: () => import('./views/home/index.vue'),
    },
    {
        path: '/fileList',
        component: () => import('./views/fileList/index.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
