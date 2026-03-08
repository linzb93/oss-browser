import sql, { createSqlFile } from '../../helper/sql';
import { Database } from '../../types/api';
import { validate } from '../oss/oss.service';
import * as ossService from '../oss/oss.service';
/**
 * 读取用户信息
 */
export async function getList() {
    return await sql((db) => db.accounts);
}
export async function getItem(id: number) {
    return await sql((db) => {
        const match = db.accounts.find((item) => item.id === id);
        return match;
    });
}
/**
 * 保存用户信息
 */
export async function save(params: Database['accounts'][number]) {
    await validate(params);
    await sql((db) => {
        const matchIndex = db.accounts.findIndex((account) => account.id === params.id);
        if (matchIndex > -1) {
            db.accounts[matchIndex] = params;
        } else {
            const nextId = db.accounts.at(-1).id + 1;
            db.accounts.push({
                ...params,
                id: nextId,
            });
            createSqlFile(params.id);
        }
    });
}
export const getDefaultAppId = async () => {
    return await sql((db) => db.defaultAppId);
};
export const setDefaultAppId = async (id: number) => {
    await sql((db) => {
        db.defaultAppId = Number(id);
    });
    if (id) {
        ossService.init();
    }
};
