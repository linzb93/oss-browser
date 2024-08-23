import { OssConfig } from "ali-oss";
import { Route } from "@linzb93/event-router";
import { omit } from "lodash-es";
import sql from '../helper/sql';
import { Request } from "../types/api";

const route = Route();
route.handle("getList", async () => {
    return {
        list: await sql((db) => {
            if (!db.accounts) {
                return []
            }
            return db.accounts.map(account => ({
                ...omit(account, ['setting']),
                shortcut: account.setting ? account.setting.shortcut : '',
                fastEnter: account.setting ? account.setting.fasterEnter : 0,
            }));
        }),
    };
});

// 添加客户端，目前仅支持阿里OSS
route.handle("create", async (req: Request<OssConfig>) => {
    await sql((db) => {
        if (req.params.id) {
            // 是编辑
            const index = db.accounts.findIndex(
                (acc) => acc.id === req.params.id
            );
            if (index > -1) {
                db.accounts[index] = {
                    ...db.accounts[index],
                    ...req.params
                };
            }
        } else {
            if (!db.accounts || !db.accounts.length) {
                db.accounts = [{
                    ...req.params,
                    id: 1
                }]
            }
        }
    })
});
// 移除客户端
route.handle("removeAccount", async (req: Request<{ id: number }>) => {
    const { id } = req.params;
    await sql((db) => {
        let { accounts } = db;
        const index = accounts.findIndex((acc) => acc.id === id);
        accounts.splice(index, 1);
    });
});

export default route;