import { sql, createSqlFile } from '../../infra/sql';
import { Database } from '../../types/api';
import { validate } from '../oss/oss.service';
import * as ossService from '../oss/oss.service';
/**
 * 读取所有账户信息列表
 * @returns {Promise<Database['accounts']>} 账户信息列表
 */
export async function getList(): Promise<Database['accounts']> {
    return await sql((db) => db.accounts);
}

/**
 * 根据ID获取指定账户信息
 * @param {number} id - 账户ID
 * @returns {Promise<Database['accounts'][number] | undefined>} 匹配的账户信息，未找到则返回 undefined
 */
export async function getItem(id: number): Promise<Database['accounts'][number] | undefined> {
    return await sql((db) => {
        const match = db.accounts.find((item) => item.id === id);
        return match;
    });
}

/**
 * 保存或更新账户信息
 * @param {Database['accounts'][number]} params - 账户信息参数
 * @returns {Promise<void>} 完成后不返回值
 */
export async function save(params: Database['accounts'][number]): Promise<void> {
    await validate(params);
    await sql((db) => {
        const matchIndex = db.accounts.findIndex((account) => account.id === params.id);
        if (matchIndex > -1) {
            db.accounts[matchIndex] = params;
        } else {
            const nextId = (db.accounts.at(-1)?.id ?? 0) + 1;
            db.accounts.push({
                ...params,
                id: nextId,
            });
            createSqlFile(nextId);
        }
    });
}

/**
 * 获取默认应用ID
 * @returns {Promise<number>} 默认应用ID
 */
export const getDefaultAppId = async (): Promise<number> => {
    return await sql((db) => db.defaultAppId);
};

/**
 * 设置默认应用ID并初始化OSS服务
 * @param {number} id - 应用ID
 * @returns {Promise<void>} 完成后不返回值
 */
export const setDefaultAppId = async (id: number): Promise<void> => {
    await sql((db) => {
        db.defaultAppId = Number(id);
    });
    if (id) {
        await ossService.init();
    }
};

/**
 * 根据ID删除账户信息
 * @param {number} id - 账户ID
 * @returns {Promise<void>} 完成后不返回值
 */
export const remove = async (id: number): Promise<void> => {
    await sql((db) => {
        const matchIndex = db.accounts.findIndex((account) => account.id === id);
        if (matchIndex > -1) {
            db.accounts.splice(matchIndex, 1);
        }
    });
};

/**
 * 获取当前默认账户
 * @returns {Promise<Database['accounts'][number]>} 当前默认账户
 */
export const getCurrentAccount = async (): Promise<Database['accounts'][number]> => {
    return (
        (await sql((db) => db.accounts.find((item) => item.id === db.defaultAppId))) ||
        ({} as Database['accounts'][number])
    );
};
