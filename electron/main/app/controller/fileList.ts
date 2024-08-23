import { basename } from "node:path";
import dayjs from "dayjs";
import { Route } from "@linzb93/event-router";
import pMap from "p-map";
import { Request } from "../types/api";
import sql from "../helper/sql";
import findClient from "../service/find";

const route = Route();

// 获取文件/目录列表
route.handle(
    "getFileList",
    async (req: Request<{ id: number; config: { prefix: string } }>) => {
        // https://help.aliyun.com/zh/oss/developer-reference/list-objects-5?spm=a2c4g.11186623.0.i2
        const { id, config } = req.params;
        const projectRes = await findClient(id);
        if (projectRes.code !== 200) {
            return projectRes;
        }
        const { client, domain } = projectRes;
        const result = await client.listV2({
            prefix: config.prefix,
            delimiter: "/",
            "max-keys": 100,
        });
        /**
         * objects会返回目录下所有的文件和目录，根据size字段判断是不是目录
         * prefixes只会返回目录
         */
        const objects = result.objects
            .filter((obj) => obj.size > 0)
            .map((obj) => ({
                ...obj,
                name: obj.name.split("/").slice(-1)[0],
                url: obj.url.replace(/^https?:\/\/[^\/]+/, domain),
            }));
        return {
            list: result.prefixes
                ? result.prefixes
                    .map((subDir) => ({
                        name: subDir.replace(/\/$/, "").split("/").slice(-1)[0],
                        type: "dir",
                    }))
                    .concat(objects)
                : objects,
        };
    }
);

// 删除文件
route.handle(
    "deleteFile",
    async (
        req: Request<{
            id: number;
            path: string;
            paths: string[];
        }>
    ) => {
        const { id, path, paths } = req.params;
        const projectRes = await findClient(id);
        if (projectRes.code !== 200) {
            return projectRes;
        }
        const { client } = projectRes;
        if (paths) {
            await pMap(paths, (path: string) => client.delete(path), {
                concurrency: 4,
            });
            await removeHistory(paths);
        } else {
            await client.delete(path);
            await removeHistory(path);
        }
        return null;
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
        const projectRes = await findClient(id);
        if (projectRes.code !== 200) {
            return projectRes;
        }
        const { client } = projectRes;
        await client.put(`${uploadPath}${name}/`, Buffer.from(""));
        return null;
    }
);

// 上传文件
route.handle(
    "upload",
    async (
        req: Request<{
            id: number;
            path: string;
            name: string;
            files: string[];
        }>
    ) => {
        const { id, path: uploadPath, files } = req.params;
        const projectRes = await findClient(id);
        if (projectRes.code !== 200) {
            return projectRes;
        }
        const { client, domain } = projectRes;
        console.log(files);
        await Promise.all(
            files.map((file: string) =>
                client.put(`${uploadPath}${basename(file)}`, file)
            )
        );
        addHistory(files.map((file) => `${domain}/${uploadPath}${basename(file)}`));
        return null;
    }
);

// 读取CSS代码设置
route.handle("getSetting", async (req: Request) => {
    const { id } = req.params;
    const projectRes = await findClient(id);
    if (projectRes.code !== 200) {
        return projectRes;
    }
    return projectRes.setting || {};
});
// 修改CSS代码设置
route.handle(
    "saveSetting",
    async (req: Request) => {
        const { id, setting } = req.params;
        const projectRes = await findClient(id);
        if (projectRes.code !== 200) {
            return projectRes;
        }
        await sql((db) => {
            const matchAccount = db.accounts.find(account => account.id === id);
            matchAccount.setting = setting;
        });
    }
);

// 获取上传记录
route.handle(
    "getHistory",
    async (
        req: Request<{
            path: string;
            pageSize: number;
            pageIndex: number;
        }>
    ) => {
        const { params } = req;
        const history = await sql((db) => db.history);
        if (!history || !history.length) {
            return {
                list: [],
                totalCount: 0,
            };
        }
        const start = (params.pageIndex - 1) * params.pageSize;
        const end = start + params.pageSize;
        const list = history.slice(start, end);
        return {
            list,
            totalCount: history.length,
        };
    }
);

// 添加上传记录
async function addHistory(filePaths: string[]) {
    await sql((db) => {
        const uploadLog = filePaths.map((item) => ({
            path: item,
            createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        }));
        db.history = db.history
            ? db.history.concat(uploadLog)
            : uploadLog;
    });
}

// 移除上传记录
async function removeHistory(filePath: string | string[]) {
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
export default route;
