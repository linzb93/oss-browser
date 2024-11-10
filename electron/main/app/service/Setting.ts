import sql from '../helper/sql';
import { type Database } from '../types/api';

export class SettingService {
    async get(): Promise<Database['setting']> {
        return await sql(
            (db) =>
                db.setting || {
                    pixel: 1,
                    openPreview: false,
                    copyTemplateId: 1,
                    homePath: '',
                }
        );
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
