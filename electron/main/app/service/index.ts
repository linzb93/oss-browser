import { omit } from "lodash-es";
import App from "./BaseOss";
import { FileItem } from "../types/vo";
import sql from "../helper/sql";

export default class {
  private apps: App[] = [];
  /**
   * 添加OSS App
   * @param app OSS App适配器
   */
  add(AppCtor: new () => App) {
    this.apps.push(new AppCtor());
  }
  /**
   * 获取匹配的App和OSS Config
   */
  private async getMatches(): Promise<{ app: App; config: any }> {
    const account = await sql((db) => db.account);
    const { platform } = account;
    const matchApp = this.apps.find((app) => app.platformId === platform);
    return {
      app: matchApp,
      config: account,
    };
  }
  /**
   * 获取文件列表
   * @param prefix 目录前缀
   */
  async getFileList(prefix: string): Promise<{
    list: FileItem[];
  }> {
    const { app, config } = await this.getMatches();
    return {
      list: await app.getFileList(prefix, config),
    };
  }
  async addPath(params: {
    prefix: string;
    name: string | string[];
    type: "directory" | "file";
  }): Promise<void> {
    const { app, config } = await this.getMatches();
    return await app.addPath({
      ...params,
      config,
    });
  }
  async deleteFile(path: string | string[]): Promise<void> {
    const { app, config } = await this.getMatches();
    await app.deleteFile(path, config);
    // await this.removeHistory(path);
  }
  async getSetting() {
    const setting = await sql((db) => db.setting);
    return setting || {};
  }
  async saveSetting(data: any) {
    await sql((db) => {
      db.setting = data;
    });
  }
  async getCollect() {
    return await sql((db) => db.collect || []);
  }
  async addCollect(data: string) {
    await sql((db) => {
      const obj = {
        id: Date.now().toString(),
        name: data,
        path: data,
      };
      if (!db.collect) {
        db.collect = [obj];
      } else {
        db.collect.push(obj);
      }
    });
  }
  async saveCollect(
    list: {
      name: string;
      path: string;
      id: string;
    }[]
  ) {
    await sql((db) => {
      db.collect = list;
    });
  }
  async getHistory({
    pageSize,
    pageIndex,
  }: {
    pageSize: number;
    pageIndex: number;
  }) {
    const history = await sql((db) => db.history);
    if (!history || !history.length) {
      return {
        list: [],
        totalCount: 0,
      };
    }
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    const list = history.slice(start, end);
    return {
      list,
      totalCount: history.length,
    };
  }
  private async removeHistory(filePath: string | string[]) {
    await sql((db) => {
      const { history } = db;
      if (!history) {
        db.history = [];
        return;
      }
      if (Array.isArray(filePath)) {
        db.history = history.filter((item) => filePath.includes(item.path));
      } else {
        db.history = history.filter((item) => item.path !== filePath);
      }
    });
  }
}
