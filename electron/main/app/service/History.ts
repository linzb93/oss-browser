import dayjs from 'dayjs';
import sql from '../helper/sql';
import { castArray } from 'lodash-es';
import { IPage } from '../types/vo';

export class HistoryService {
    async get(param: IPage) {
        const { pageIndex, pageSize } = param;
        const history = await sql((db) => db.history);
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
    async add(data: string) {
        await sql((db) => {
            const { history } = db;
            const realPath = castArray(data.split(','));
            const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
            if (!history) {
                db.history = realPath.map((item) => ({
                    path: item,
                    createTime: now,
                }));
                return;
            }
            db.history = db.history.concat(
                realPath.map((item) => ({
                    path: item,
                    createTime: now,
                }))
            );
        });
    }
    async remove(data: string) {
        await sql((db) => {
            const { history } = db;
            const realPath = castArray(data.split(','));
            db.history = history.filter((item) => !realPath.includes(item.path));
        });
    }
}
