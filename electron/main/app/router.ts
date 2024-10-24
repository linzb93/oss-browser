import { ipcMain } from "electron";
import { createServer } from "@linzb93/event-router";
import login from "./controller/login";
import fileList from "./controller/fileList";
import commonFn from "./controller/common";
import { HTTP_STATUS } from "./helper/constant";
export default () => {
  const app = createServer({
    handle(name: string, callback: Function) {
      return ipcMain.handle(name, async (_, dataStr) => {
        return await callback(JSON.parse(dataStr));
      });
    },
  });
  app.use(async (_, next) => {
    const res = await next();
    const { result } = res;
    if (result.code && result.code !== HTTP_STATUS.SUCCESS) {
      return {
        ...result,
        result: null,
      };
    }
    return {
      code: HTTP_STATUS.SUCCESS,
      result,
      success: true,
    };
  });
  app.use("login", login);
  app.use("file", fileList);
  commonFn(app);
};
