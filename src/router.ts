import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("./views/home/index.vue"),
  },
  {
    path: "/fileList",
    component: () => import("./views/fileList/index.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  console.log(to.fullPath);
  next();
});

export default router;
