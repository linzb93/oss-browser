import { join, dirname } from 'node:path';
import fs from 'fs-extra';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { root } from '../enums/index.enum';
import { Database } from '../types/api';

function initDb() {
    const indexDbPath = join(root, 'index.json');
    const accountDir = join(root, 'app');
    try {
        fs.accessSync(indexDbPath);
    } catch (error) {
        fs.mkdirSync(dirname(indexDbPath), {
            recursive: true,
        });
        fs.writeFileSync(indexDbPath, '{}');
    }
    try {
        fs.accessSync(accountDir);
    } catch (error) {
        fs.mkdirSync(accountDir);
    }
}
initDb();

type HomeOptions = 'accounts' | 'defaultAppId';

async function sql<T>(callback: (data: Pick<Database, HomeOptions>) => T): Promise<T>;
async function sql<T>(accountId: number, callback: (data: Omit<Database, HomeOptions>) => T): Promise<T>;
async function sql<T>(...args: any[]): Promise<T> {
    let accountId = 0;
    let callback: Function;
    if (args.length === 1) {
        callback = args[0];
    } else if (args.length === 2) {
        callback = args[1];
        accountId = args[0];
    }
    const filePath = accountId ? join(root, `app/${accountId}.json`) : join(root, 'index.json');
    const db = new Low(new JSONFile(filePath), {});
    await db.read();
    const data = db.data as unknown as Database;
    let result: any;
    if (typeof callback === 'function') {
        result = await callback(data);
    }
    await db.write();
    return result;
}
export default sql;

export const createSqlFile = async (id: number) => {
    const accountDir = join(root, 'app');
    await fs.writeJSON(join(accountDir, `${id}.json`), {
        id: id,
        setting: {
            homePath: 'diankeduo',
            pixel: 2,
            previewType: 1,
            copyTemplateId: 2,
            templateType: 1,
        },
    });
};
