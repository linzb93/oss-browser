import sql from '../helper/sql';
import { Database } from '../types/api';

export class CollectService {
    async get() {
        return await sql((db) => db.collect || []);
    }
    async add(data: string) {
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
    async set(list: Database['collect']) {
        await sql((db) => {
            db.collect = list;
        });
    }
}
