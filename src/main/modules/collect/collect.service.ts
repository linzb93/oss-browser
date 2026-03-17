import { sql } from '../../infra/sql';
import { Database } from '../../types/api';

/**
 * 获取当前默认应用的所有收藏记录
 * @returns {Promise<Database['collect']>} 收藏记录列表
 */
export async function get() {
    const id = await sql((db) => db.defaultAppId);
    return await sql(id, (db) => db.collect || []);
}

/**
 * 添加一条收藏记录
 * @param {string} data - 需要收藏的路径
 * @returns {Promise<void>} 完成后不返回值
 */
export async function add(data: string): Promise<void> {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        const obj = {
            id: Date.now().toString(),
            name: data
                .split('/')
                .filter((item) => !!item)
                .at(-1) as string,
            path: data,
        };
        if (!db.collect) {
            db.collect = [obj];
        } else {
            db.collect.push(obj);
        }
    });
}

/**
 * 覆盖设置当前应用的收藏记录列表
 * @param {Database['collect']} list - 新的收藏记录列表
 * @returns {Promise<void>} 完成后不返回值
 */
export async function set(list: Database['collect']): Promise<void> {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        db.collect = list;
    });
}
