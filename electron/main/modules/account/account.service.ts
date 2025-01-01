import sql from '../../helper/sql';
import { Database } from '../../types/api';
/**
 * 读取用户信息
 */
export async function get() {
    return await sql((db) => db.account);
}
/**
 * 保存用户信息
 */
export async function save(params: Database['account']) {
    await sql((db) => {
        db.account = params;
    });
}
