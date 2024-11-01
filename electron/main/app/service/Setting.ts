import sql from '../helper/sql';
import { Database } from '../types/api';

export class SettingService {
    async get() {
        return await sql((db) => db.setting || {});
    }
    async set(data: Database['setting']) {
        await sql((db) => {
            db.setting = {
                ...db.setting,
                ...data,
            };
        });
    }
    async setHome(url: string) {
        await sql((db) => {
            db.setting = {
                ...db.setting,
                homePath: url,
            };
        });
    }
}
