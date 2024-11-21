import sql from '../helper/sql';
import { type Database } from '../types/api';
/**
 * 用户设置管理
 */
export class SettingService {
    async get(): Promise<Database['setting']> {
        return await sql(
            (db) =>
                db.setting || {
                    pixel: 1,
                    previewType: 1,
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
