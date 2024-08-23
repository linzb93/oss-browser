import { join, basename } from "node:path";
import http from "node:http";
import fs from "node:fs";
import { clipboard, dialog } from "electron";
import { Application } from "@linzb93/event-router";
// import { createClient } from "webdav";
import pMap from "p-map";
import { Request } from "../types/api";

export default async (app: Application) => {
  // 复制文本
  app.handle("copy", async (req: Request<string>) => {
    const text = req.params;
    clipboard.writeText(text);
  });

  // 下载文件
  app.handle("download", async (req: Request<string | string[]>) => {
    if (Array.isArray(req.params)) {
      // 下载多份文件
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });
      if (result.canceled) {
        return {};
      }
      await pMap(
        req.params,
        (url: string) =>
          new Promise((resolve) => {
            http.get(url, (resp) => {
              if (resp.statusCode === 200) {
                resp
                  .pipe(
                    fs.createWriteStream(
                      join(result.filePaths[0], basename(url))
                    )
                  )
                  .on("finish", resolve);
              }
            });
          }),
        { concurrency: 4 }
      );
    }
    const url = req.params as string;
    const result = await dialog.showSaveDialog({
      defaultPath: basename(url),
    });
    if (result.canceled) {
      return {};
    }
    await new Promise((resolve) => {
      http.get(url, (resp) => {
        if (resp.statusCode === 200) {
          resp
            .pipe(fs.createWriteStream(result.filePath))
            .on("finish", resolve);
        }
      });
    });
  });

  // 选择文件夹路径
  app.handle(
    "get-selected-path",
    async (req: Request<{ multiSelections: boolean }>) => {
      const {
        params: { multiSelections },
      } = req;
      const result = await dialog.showOpenDialog({
        properties: multiSelections
          ? ["openDirectory", "multiSelections"]
          : ["openDirectory"],
      });
      if (result.canceled) {
        return {
          path: "",
        };
      }
      if (multiSelections) {
        return {
          paths: result.filePaths,
        };
      }
      return {
        path: result.filePaths[0],
      };
    }
  );

  // 同步
  // app.handle("sync", async () => {
  //   fs.createReadStream(join(root, "sync.json")).pipe(
  //     syncClient.createWriteStream("electron-lin-tools/sync.json")
  //   );
  //   return {
  //     success: true,
  //   };
  // });
};
