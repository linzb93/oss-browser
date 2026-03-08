import { join, dirname } from 'node:path';
import fs from 'fs-extra';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { root } from '../enums/index.enum';
import { Database } from '../types/api';

const fileQueue = new Map<string, Promise<unknown>>();

function runSerial<T>(key: string, task: () => Promise<T>): Promise<T> {
    const prev = fileQueue.get(key) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(task);
    fileQueue.set(key, next as Promise<unknown>);
    next.finally(() => {
        if (fileQueue.get(key) === (next as Promise<unknown>)) {
            fileQueue.delete(key);
        }
    });
    return next;
}

async function ensureJsonFile(filePath: string) {
    await fs.ensureDir(dirname(filePath));
    const exists = await fs.pathExists(filePath);
    if (!exists) {
        await fs.writeFile(filePath, '{}');
        return;
    }
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat && stat.size === 0) {
        await fs.writeFile(filePath, '{}');
    }
}

function initDb() {
    const indexDbPath = join(root, 'index.json');
    const accountDir = join(root, 'app');
    fs.ensureDirSync(dirname(indexDbPath));
    fs.ensureDirSync(accountDir);

    if (!fs.pathExistsSync(indexDbPath)) {
        fs.writeFileSync(indexDbPath, '{}');
        return;
    }

    try {
        const stat = fs.statSync(indexDbPath);
        if (stat.size === 0) {
            fs.writeFileSync(indexDbPath, '{}');
        }
    } catch (error) {
        fs.writeFileSync(indexDbPath, '{}');
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
    return runSerial(filePath, async () => {
        await ensureJsonFile(filePath);
        const db = new Low<Database>(new JSONFile<Database>(filePath), {} as Database);
        await db.read();
        db.data ||= {} as Database;
        const data = db.data as unknown as Database;
        let result: any;
        if (typeof callback === 'function') {
            result = await callback(data);
        }
        await db.write();
        return result;
    });
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
