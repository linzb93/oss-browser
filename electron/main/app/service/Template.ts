import { omit } from 'lodash-es';
import { Database } from '../types/api';
import sql from '../helper/sql';
import { SettingService } from './Setting';
import { UtilService } from './Util';

export class TemplateService {
    private setting = new SettingService();
    private util = new UtilService();
    async getList() {
        return await sql((db) => {
            if (!db.templates) {
                return [];
            }
            return db.templates.map((item) => omit(item, ['content']));
        });
    }
    async getDetail(id: number) {
        return await sql((db) => {
            if (!db.templates) {
                return null;
            }
            const match = db.templates.find((item) => item.id === id);
            return match || null;
        });
    }
    async add(obj: Database['templates'][number]) {
        await sql((db) => {
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
                id: db.templates.at(-1).id + 1,
            });
        });
    }
    async edit(obj: Database['templates'][number]) {
        await sql((db) => {
            const match = db.templates.find((item) => item.id === obj.id);
            if (!match) {
                return;
            }
            match.name = obj.name;
            match.content = obj.content;
        });
    }
    async remove({ id }: { id: number }) {
        await sql((db) => {
            db.templates = db.templates.filter((item) => item.id !== id);
        });
    }
    async copy(data: { width: number; height: number; url: string }) {
        const userSetting = await this.setting.get();
        const templateObj = await this.getDetail(userSetting.copyTemplateId);
        if (!templateObj) {
            throw new Error('未添加复制模板');
        }
        const width = userSetting.pixel === 2 ? parseInt((data.width / 2).toString()) : data.width;
        const height = userSetting.pixel === 2 ? parseInt((data.height / 2).toString()) : data.height;
        const result = templateObj.content
            .replace('${width}', width.toString())
            .replace('${height}', height.toString())
            .replace('${url}', data.url);
        this.util.copy(result);
    }
}
