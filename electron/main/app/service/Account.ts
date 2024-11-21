import sql from '../helper/sql';
import { Database } from '../types/api';
export class AccountService {
    /**
     * 读取用户信息
     */
    async get() {
        return await sql((db) => db.account);
    }
    /**
     * 保存用户信息
     */
    async save(params: Database['account']) {
        await sql((db) => {
            db.account = params;
        });
    }
}
