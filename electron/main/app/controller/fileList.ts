import { Route } from "@linzb93/event-router";
import { Request } from "../types/api";
import Service from "../service";
import AliOss from "../service/AliOss";

const route = Route();
const service = new Service();
service.add(AliOss);

// 获取文件/目录列表
route.handle(
  "getFileList",
  async (req: Request<{ id: number; config: { prefix: string } }>) => {
    const { id, config } = req.params;
    return await service.getFileList(id, config.prefix);
  }
);

// 删除文件
route.handle(
  "deleteFile",
  async (
    req: Request<{
      id: number;
      path: string | string[];
    }>
  ) => {
    const { id, path } = req.params;
    return await service.deleteFile(id, path);
  }
);

// 创建目录
route.handle(
  "createDirectory",
  async (
    req: Request<{
      id: number;
      path: string;
      name: string;
    }>
  ) => {
    const { id, path: uploadPath, name } = req.params;
    await service.addPath({
      id,
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
      id: number;
      path: string;
      files: string[];
    }>
  ) => {
    const { id, path: uploadPath, files } = req.params;
    await service.addPath({
      id,
      prefix: uploadPath,
      name: files,
      type: "file",
    });
  }
);

// 读取CSS代码设置
route.handle("getSetting", async (req: Request) => {
  const { id } = req.params;
  return await service.getSetting(id);
});
// 修改CSS代码设置
route.handle("saveSetting", async (req: Request) => {
  await service.saveSetting(req.params);
});

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
