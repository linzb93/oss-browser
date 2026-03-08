import { Database } from '../../types/api';
import sql from '../../helper/sql';

export const getList = async () => {
    const id = await sql((db) => db.defaultAppId);
    return await sql(id, (db) => db.workflow || []);
};
export const getById = async (id: number) => {
    const appId = await sql((db) => db.defaultAppId);
    return await sql(appId, (db) => {
        if (!db.workflow) {
            return null;
        }
        return db.workflow.find((item) => item.id === id);
    });
};
export const add = async (params: Omit<Database['workflow'][number], 'id'>) => {
    const appId = await sql((db) => db.defaultAppId);
    await sql(appId, (db) => {
        if (!db.workflow) {
            db.workflow = [
                {
                    ...params,
                    id: 1,
                },
            ];
            return;
        }
        db.workflow.push({
            ...params,
            id: db.workflow.length + 1,
        });
    });
};
export const edit = async (params: Database['workflow'][number]) => {
    const appId = await sql((db) => db.defaultAppId);
    await sql(appId, (db) => {
        const idx = db.workflow.findIndex((item) => item.id === params.id);
        if (idx !== -1) {
            db.workflow[idx] = params;
        }
    });
};
export const remove = async (id: number) => {
    const appId = await sql((db) => db.defaultAppId);
    await sql(appId, (db) => {
        db.workflow = db.workflow.filter((item) => item.id !== id);
    });
};
