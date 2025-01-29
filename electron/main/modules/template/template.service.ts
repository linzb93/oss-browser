import { omit } from 'lodash-es';
import { Database } from '../../types/api';
import sql from '../../helper/sql';
import * as settingService from '../setting/setting.service';
import * as utilService from '../util/util.service';

export async function getList() {
    const id = await sql((db) => db.defaultAppId);
    return await sql(id, (db) => {
        if (!db.templates) {
            return [];
        }
        return db.templates.map((item) => omit(item, ['content']));
    });
}
export async function getDetail(id: number) {
    const appId = await sql((db) => db.defaultAppId);
    return await sql(appId, (db) => {
        if (!db.templates) {
            return null;
        }
        const match = db.templates.find((item) => item.id === id);
        return match || null;
    });
}
export async function add(obj: Database['templates'][number]) {
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
                return db.templates.at(-1).id + 1;
            })(),
        });
    });
}
export async function edit(obj: Database['templates'][number]) {
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
export async function remove({ id }: { id: number }) {
    const appId = await sql((db) => db.defaultAppId);
    await sql(appId, (db) => {
        db.templates = db.templates.filter((item) => item.id !== id);
    });
}
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
