import sql from '../../helper/sql';
import { type Database } from '../../types/api';
/**
 * 用户设置管理
 */

export async function get(): Promise<Database['setting']> {
    const id = await sql((db) => db.defaultAppId);
    return await sql(
        id,
        (db) =>
            db.setting || {
                pixel: 1,
                previewType: 1,
                copyTemplateId: 1,
                homePath: '',
            }
    );
}
export async function set(data: Database['setting']) {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        db.setting = {
            ...db.setting,
            ...data,
        };
    });
}
export async function setHome(url: string) {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        db.setting = {
            ...db.setting,
            homePath: url,
        };
    });
}
