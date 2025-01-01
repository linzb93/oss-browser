import { HTTP_STATUS } from '../enums/index.enum';
export default async (callback: Function) => {
    try {
        const result = await callback();
        return {
            code: HTTP_STATUS.SUCCESS,
            result,
        };
    } catch (error) {
        return {
            code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            result: null,
            message: error.message || 'SERVER_ERROR',
        };
    }
};
