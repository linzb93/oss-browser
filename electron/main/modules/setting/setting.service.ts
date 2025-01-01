import sql from '../../helper/sql';
import { type Database } from '../../types/api';
/**
 * 用户设置管理
 */

export async function get(): Promise<Database['setting']> {
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
export async function set(data: Database['setting']) {
    await sql((db) => {
        db.setting = {
            ...db.setting,
            ...data,
        };
    });
}
export async function setHome(url: string) {
    await sql((db) => {
        db.setting = {
            ...db.setting,
            homePath: url,
        };
    });
}
