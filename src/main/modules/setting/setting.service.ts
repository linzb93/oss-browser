import { sql } from '../../infra/sql';
import { type Database } from '../../types/api';
/**
 * 用户设置管理
 */

/**
 * 获取当前用户的设置信息
 * 如果数据库中不存在设置，则返回默认值
 * @returns {Promise<Database['setting']>} 用户设置对象
 */
export async function get(): Promise<Database['setting']> {
    const id = await sql((db) => db.defaultAppId);
    return await sql(
        id,
        (db) =>
            db.setting || {
                pixel: 1,
                previewType: 1,
                copyTemplateId: 0,
                copyWorkflowId: 0,
                homePath: '',
            },
    );
}

/**
 * 更新用户设置
 * @param {Database['setting']} data - 要更新的设置数据
 * @returns {Promise<void>}
 */
export async function set(data: Database['setting']): Promise<void> {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        db.setting = {
            ...db.setting,
            ...data,
        };
    });
}

/**
 * 单独设置主页路径
 * @param {string} url - 新的主页路径 URL
 * @returns {Promise<void>}
 */
export async function setHome(url: string): Promise<void> {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        db.setting = {
            ...db.setting,
            homePath: url,
        };
    });
}
