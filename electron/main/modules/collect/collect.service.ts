import sql from '../../helper/sql';
import { Database } from '../../types/api';

export async function get() {
    return await sql((db) => db.collect || []);
}
export async function add(data: string) {
    await sql((db) => {
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
    await sql((db) => {
        db.collect = list;
    });
}
