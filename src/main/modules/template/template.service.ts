import { omit } from 'lodash-es';
import { Database } from '../../types/api';
import { sql } from '../../infra/sql';
import * as settingService from '../setting/setting.service';
import * as utilService from '../util/util.service';

/**
 * 获取当前应用的所有模板列表（不包含内容字段）
 * @returns {Promise<Omit<Database['templates'][number], 'content'>[]>} 模板列表
 */
export async function getList(): Promise<Omit<Database['templates'][number], 'content'>[]> {
    const id = await sql((db) => db.defaultAppId);
    return await sql(id, (db) => {
        if (!db.templates) {
            return [];
        }
        return db.templates.map((item) => omit(item, ['content']));
    });
}

/**
 * 根据ID获取模板详细信息
 * @param {number} id - 模板ID
 * @returns {Promise<Database['templates'][number] | null>} 匹配的模板信息，未找到返回 null
 */
export async function getDetail(id: number): Promise<Database['templates'][number] | null> {
    const appId = await sql((db) => db.defaultAppId);
    return await sql(appId, (db) => {
        if (!db.templates) {
            return null;
        }
        const match = db.templates.find((item) => item.id === id);
        return match || null;
    });
}

/**
 * 添加新模板
 * @param {Database['templates'][number]} obj - 模板对象（包含名称和内容）
 * @returns {Promise<void>} 完成后不返回值
 */
export async function add(obj: Database['templates'][number]): Promise<void> {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        if (!db.templates) {
            db.templates = [
                {
                    name: obj.name,
                    content: obj.content,
                    id: 1,
                },
            ];
            return;
        }
        db.templates.push({
            name: obj.name,
            content: obj.content,
            id: (() => {
                if (!db.templates || !db.templates.length) {
                    return 1;
                }
                return (db.templates as any[]).at(-1).id + 1;
            })(),
        });
    });
}

/**
 * 修改现有模板
 * @param {Database['templates'][number]} obj - 包含更新信息的模板对象
 * @returns {Promise<void>} 完成后不返回值
 */
export async function edit(obj: Database['templates'][number]): Promise<void> {
    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        const match = db.templates.find((item) => item.id === obj.id);
        if (!match) {
            return;
        }
        match.name = obj.name;
        match.content = obj.content;
    });
}

/**
 * 根据ID删除模板
 * @param {{ id: number }} params - 包含要删除模板ID的对象
 * @param {number} params.id - 模板ID
 * @returns {Promise<void>} 完成后不返回值
 */
export async function remove({ id }: { id: number }): Promise<void> {
    const appId = await sql((db) => db.defaultAppId);
    await sql(appId, (db) => {
        db.templates = db.templates.filter((item) => item.id !== id);
    });
}

/**
 * 复制模板内容到剪贴板，自动替换宽高和URL占位符
 * @param {{ width: number; height: number; url: string }} data - 图片或文件的元数据
 * @param {number} data.width - 宽度
 * @param {number} data.height - 高度
 * @param {string} data.url - 链接地址
 * @returns {Promise<void>} 完成后不返回值
 */
export async function copy(data: { width: number; height: number; url: string }) {
    const userSetting = await settingService.get();
    const templateObj = await getDetail(userSetting.copyTemplateId);
    if (!templateObj) {
        throw new Error('未添加复制模板');
    }
    const width = userSetting.pixel === 2 ? parseInt((data.width / 2).toString()) : data.width;
    const height = userSetting.pixel === 2 ? parseInt((data.height / 2).toString()) : data.height;
    const result = templateObj.content
        .replace('${width}', width.toString())
        .replace('${height}', height.toString())
        .replace('${url}', data.url);
    utilService.copy(result);
}
