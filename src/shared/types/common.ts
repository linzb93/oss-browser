export type AnyObject = Record<string, any>;
/**
 * 分页请求参数
 */
export interface IPageRequest {
    pageIndex: number;
    pageSize: number;
}
/**
 * 分页响应参数
 */
export interface IPageResponse<T = AnyObject> {
    totalCount: number;
    list: T[];
}
