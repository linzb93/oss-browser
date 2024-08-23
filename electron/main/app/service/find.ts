import { HTTP_STATUS } from "../helper/constant";
import sql from "../helper/sql";
import { omit } from "lodash-es";
import OSS, { OssConfig } from "ali-oss";
// 根据id查找对应的OSS客户端
export default async function findClient(id: number) {
  const accounts = await sql((db) => db.accounts);
  const match = accounts.find((item) => item.id === id);
  if (!match) {
    return {
      code: HTTP_STATUS.BAD_REQUEST,
      message: "OSS不存在",
    };
  }
  const ossobj = omit(match, ["platform", "name"]) as unknown as OssConfig;
  return {
    code: 200,
    client: new OSS(ossobj),
    domain: match.domain,
    setting: match.setting
  };
}