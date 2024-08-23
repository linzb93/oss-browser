import { join, dirname } from "node:path";
import fs from "node:fs";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { root } from "./constant";
import { Database } from "../types/api";

const dbPath = join(root, "app.json");
try {
    fs.accessSync(dbPath);
} catch (error) {
    fs.mkdirSync(dirname(dbPath), {
        recursive: true,
    });
    fs.writeFileSync(
        dbPath,
        '{}'
    );
}
const db = new Low(new JSONFile(dbPath), {});

export default async function sql<T>(callback: (data: Database) => T): Promise<T> {
    await db.read();
    const data = db.data as unknown as Database;
    let result: any;
    if (typeof callback === "function") {
        result = await callback(data);
    }
    await db.write();
    return result;
}