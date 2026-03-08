import sql from '../../helper/sql';
import { Database } from '../../types/api';

export async function get() {
    const id = await sql((db) => db.defaultAppId);
    return await sql(id, (db) => db.collect || []);
}
export async function add(data: string) {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        const obj = {
            id: Date.now().toString(),
            name: data
                .split('/')
                .filter((item) => !!item)
                .at(-1),
            path: data,
        };
        if (!db.collect) {
            db.collect = [obj];
        } else {
            db.collect.push(obj);
        }
    });
}
export async function set(list: Database['collect']) {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        db.collect = list;
    });
}
