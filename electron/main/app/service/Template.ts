import { Database } from '../types/api';
import sql from '../helper/sql';
export class TemplateService {
    async get(id: number) {
        return await sql((db) => {
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
}
