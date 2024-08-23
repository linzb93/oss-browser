import { ref, unref, isReactive, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { sleep } from "@linzb93/utils";
import { createClient } from "@linzb93/event-router";
import { loading } from "./util";

interface Option {
  delay?: number;
  showLoading?: boolean;
}

const request = createClient({
  invoke(name, data) {
    return window.ipcRenderer.invoke(name, JSON.stringify(data));
  },
});

export default async function doRequest(
  path: string,
  params?: any,
  options?: Option
) {
  if (options?.showLoading) {
    loading.open();
  }
  const res = await request(path, params);
  if (options?.showLoading) {
    loading.close();
  }
  if (options?.delay) {
    await sleep(options.delay);
  }
  console.groupCollapsed(`发送请求：%c${path}%c`, "color:green", "");
  console.log("参数：");
  console.log(isReactive(params) ? unref(params) : params);
  console.log("收到请求结果：");
  console.log(res);
  console.groupEnd();
  if (res.code !== 200) {
    return Promise.reject(res);
  }
  return res.result;
}

// hook
export function useRequest<T = any>(
  path: string,
  params?: any,
  options?: Option
) {
  const loaded = shallowRef(false);
  const result = ref<T>();
  return {
    loaded,
    result,
    async fetch() {
      const res = await doRequest(path, params, options);
      loaded.value = true;
      result.value = res;
    },
  };
}

export const requestUtil = {
  /**
 * 复制文本
 * @param {string} text 复制的文本
 */
  copy(text: string) {
    doRequest("copy", text);
    ElMessage.success("复制成功");
  },

  /**
 * 下载文件，支持单个或批量下载
 * @param {string | string[]} url 下载地址
 * @returns 
 */
  async download(url: string | string[]) {
    try {
      await doRequest("download", url);
    } catch (error) {
      return;
    }
    ElMessage.success("下载成功");
  },
  /**
   * 打开网站或者文件
   * @param url 网址或者本地文件地址
   */
  open(type: "vscode" | "path" | "web", url: string | string[]) {
    doRequest("open", {
      type,
      url
    });
  }
}