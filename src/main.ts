import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import "./styles/common.scss";
import App from "./App.vue";
import router from "./router";
createApp(App)
  .use(ElementPlus, {
    locale: zhCn,
  })
  .use(router)
  .use(createPinia())
  .mount("#app")
  .$nextTick(() => {
    postMessage({ payload: "removeLoading" }, "*");
  });
