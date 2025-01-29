import { Database } from '../../types/api';
import sql from '../../helper/sql';

export const getList = async () => {};
export const add = async (params: Omit<Database['workflow'], 'id'>) => {};
export const edit = async (params: Database['workflow']) => {};
export const remove = async (id: number) => {};
