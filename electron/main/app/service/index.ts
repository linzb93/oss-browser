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
  private async getMatches(id: number): Promise<{ app: App; config: any }> {
    const account = await sql((db) => db.accounts);
    const matchAccount = account.find((account) => account.id === id);
    const { platform } = matchAccount;
    const matchApp = this.apps.find((app) => app.platformId === platform);
    return {
      app: matchApp,
      config: matchAccount,
    };
  }
  /**
   * 获取文件列表
   * @param id 账号ID
   * @param prefix 目录前缀
   */
  async getFileList(
    id: number,
    prefix: string
  ): Promise<{
    list: FileItem[];
  }> {
    const { app, config } = await this.getMatches(id);
    return {
      list: await app.getFileList(prefix, config),
    };
  }
  async addPath(params: {
    id: number;
    prefix: string;
    name: string | string[];
    type: "directory" | "file";
  }): Promise<void> {
    const { app, config } = await this.getMatches(params.id);
    return await app.addPath({
      ...omit(params, ["id"]),
      config,
    });
  }
  async deleteFile(id: number, path: string | string[]): Promise<void> {
    const { app, config } = await this.getMatches(id);
    await app.deleteFile(path, config);
    // await this.removeHistory(path);
  }
  async getSetting(id: number) {
    const { config } = await this.getMatches(id);
    return config.setting || {};
  }
  async saveSetting(data: any) {
    const { id, ...setting } = data;
    await sql((db) => {
      const matchAccount = db.accounts.find((account) => account.id === id);
      matchAccount.setting = {
        ...matchAccount.setting,
        ...setting,
      };
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
