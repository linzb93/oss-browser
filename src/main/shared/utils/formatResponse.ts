import { HTTP_STATUS } from '@/main/shared/constants/http';

/**
 * 格式化响应结果，捕获回调函数中的异常并统一返回格式
 * @param {Function} callback - 需要执行的回调函数
 * @returns {Promise<{code: number, result: any, message?: string}>} 包含状态码、结果或错误信息的对象
 * @example
 * const res = await formatResponse(() => ({ data: 'test' }));
 * // res === { code: 200, result: { data: 'test' } }
 */
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
            message: (error as Error).message || 'SERVER_ERROR',
        };
    }
};
