import dayjs from 'dayjs';
import sql from '../helper/sql';
import { Database } from '../types/api';
import { castArray } from 'lodash-es';
interface IPage {
    pageIndex: number;
    pageSize: number;
}
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
                db.history = [
                    {
                        path: realPath[0],
                        createTime: now,
                    },
                ];
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
            db.history = history.filter((item) => realPath.includes(item.path));
        });
    }
}
