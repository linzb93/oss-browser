import { Route } from "@linzb93/event-router";
import { Request } from "../types/api";
import Service from "../service";
import AliOss from "../service/AliOss";

const route = Route();
const service = new Service();
service.add(AliOss);

// 获取文件/目录列表
route.handle("getFileList", async (req: Request<{ prefix: string }>) => {
  const { prefix } = req.params;
  return await service.getFileList(prefix);
});

// 删除文件
route.handle(
  "deleteFile",
  async (
    req: Request<{
      path: string | string[];
    }>
  ) => {
    const { path } = req.params;
    return await service.deleteFile(path);
  }
);

// 创建目录
route.handle(
  "createDirectory",
  async (
    req: Request<{
      path: string;
      name: string;
    }>
  ) => {
    const { path: uploadPath, name } = req.params;
    await service.addPath({
      prefix: uploadPath,
      name,
      type: "directory",
    });
  }
);

// 上传文件
route.handle(
  "upload",
  async (
    req: Request<{
      path: string;
      files: string[];
    }>
  ) => {
    const { path: uploadPath, files } = req.params;
    await service.addPath({
      prefix: uploadPath,
      name: files,
      type: "file",
    });
  }
);

// 设置为首页
route.handle(
  "setHome",
  async (
    req: Request<{
      path: string;
    }>
  ) => {
    const { path } = req.params;
    await service.saveSetting({
      homePath: path,
    });
  }
);

// 读取CSS代码设置
route.handle("getSetting", async () => {
  return await service.getSetting();
});
// 修改CSS代码设置
route.handle("saveSetting", async (req: Request) => {
  await service.saveSetting(req.params);
});

// 获取收藏夹
route.handle("getCollect", async () => {
  return await service.getCollect();
});
// 添加收藏夹
route.handle("addCollect", async (req: Request<string>) => {
  await service.addCollect(req.params);
});
// 编辑收藏夹
route.handle(
  "saveCollect",
  async (
    req: Request<
      {
        name: string;
        path: string;
        id: string;
      }[]
    >
  ) => {
    await service.saveCollect(req.params);
  }
);

// 获取上传记录
route.handle(
  "getHistory",
  async (
    req: Request<{
      pageSize: number;
      pageIndex: number;
    }>
  ) => {
    return await service.getHistory(req.params);
  }
);
export default route;
