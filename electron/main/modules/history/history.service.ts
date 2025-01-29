import { join, basename } from 'node:path';
import dayjs from 'dayjs';
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
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    const list = history.slice(start, end);
    return {
        list,
        totalCount: history.length,
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
            }));
            return;
        }
        db.history = db.history.concat(
            list.map((item) => ({
                path: item,
                createTime: now,
            }))
        );
    });
}
export async function remove(data: string) {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        const { history } = db;
        const realPath = data.split(',');
        db.history = history.filter((item) => !realPath.includes(item.path));
    });
}
