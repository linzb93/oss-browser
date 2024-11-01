import sql from '../helper/sql';
import { Database } from '../types/api';
export class AccountService {
    async get() {
        return await sql((db) => db.account);
    }
    async save(params: Database['account']) {
        await sql((db) => {
            db.account = params;
        });
    }
}
