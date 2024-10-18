import { ipcMain } from "electron";
import { createServer } from "@linzb93/event-router";
import login from "./controller/login";
import fileList from "./controller/fileList";
import commonFn from "./controller/common";

export default () => {
  const app = createServer({
    handle(name: string, callback: Function) {
      return ipcMain.handle(name, async (_, dataStr) => {
        return await callback(JSON.parse(dataStr));
      });
    },
  });
  app.use("login", login);
  app.use("file", fileList);
  commonFn(app);
};
