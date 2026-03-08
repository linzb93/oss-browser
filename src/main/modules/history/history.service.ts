import { join, basename } from 'node:path';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import sql from '../../helper/sql';
import { IPage } from '../../types/vo';
import { ossEvents } from '../oss/oss.repository';
import slash from 'slash';

export function init() {
    ossEvents.on('add', (params) => {
        add(params);
    });
    ossEvents.on('remove', (path) => {
        remove(path);
    });
}

export async function get(param: IPage) {
    const { pageIndex, pageSize } = param;
    const id = await sql((db) => db.defaultAppId);
    const history = await sql(id, (db) => db.history);
    if (!history || !history.length) {
        return {
            list: [],
            totalCount: 0,
        };
    }
    const reverseHistory = [...history].reverse();
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    const list = reverseHistory.slice(start, end);
    return {
        list,
        totalCount: reverseHistory.length,
    };
}
export async function add(data: { prefix: string; names: string }) {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        const list = data.names
            .split(',')
            .filter((item) => !item.endsWith('/'))
            .map((item) => slash(join(data.prefix, basename(item))));
        const { history } = db;
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        if (!history) {
            db.history = list.map((item) => ({
                path: item,
                createTime: now,
                id: uuidv4(),
            }));
            return;
        }
        db.history = db.history.concat(
            list.map((item) => ({
                path: item,
                createTime: now,
                id: uuidv4(),
            })),
        );
    });
}
export async function remove(ids: string[]) {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        const { history } = db;
        db.history = history.filter((item) => !ids.includes(item.id));
    });
}
