import { ipcMain } from "electron";
import { createServer } from "@linzb93/event-router";
import home from "./controller/home";
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
    app.use("home", home);
    app.use("file", fileList);
    commonFn(app);
};