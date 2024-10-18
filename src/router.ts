import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("./views/fileList/index.vue"),
  },
  {
    path: "/login",
    component: () => import("./views/login/index.vue"),
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
