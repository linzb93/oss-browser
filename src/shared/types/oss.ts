export interface TableItem {
    /**
     * 文件名
     */
    name: string;
    path: string;
    /**
     * 文件大小
     */
    size: number;
    /**
     * 文件大小，已格式化，含单位名称
     */
    sizeFormat: string;
    /**
     * 文件类型
     */
    type?: string;
    /**
     * 最后修改时间
     */
    lastModified?: string | number;
}
/**
 * 服务端返回的列表项，目录项用 type === 'directory' 表达。
 */
export interface ResponseTableItem {
    name: string;
    /**
     * 文件类型；目录项固定为 'directory'
     */
    type: string;
    size: number;
    lastModified?: string | number;
}
export type UploadedTableItem = ResponseTableItem & Pick<TableItem, 'path'>;
export type ExtraTableItem = UploadedTableItem & { url: string };
export interface AddParams {
    prefix: string;
    names: string;
    type: 'directory' | 'files';
}
export interface BucketItem {
    name: string;
}

/**
 * 分页拉取文件列表的请求参数
 */
export interface GetOSSListParams {
    /**
     * 目录前缀
     */
    prefix: string;
    /**
     * 每页条数
     */
    pageSize: number;
    /**
     * 翻页方向
     * - 'reset'  : 重新拉取首页（清空翻页状态）
     * - 'next'   : 取下一页
     * - 'prev'   : 取上一页
     */
    direction: 'reset' | 'next' | 'prev';
}

/**
 * 分页拉取文件列表的响应
 */
export interface GetOSSListResponse {
    list: ResponseTableItem[];
    /**
     * 是否还有下一页
     */
    hasNext: boolean;
    /**
     * 是否还有上一页（首页时为 false）
     */
    hasPrev: boolean;
    /**
     * 当前页码（从 1 开始）
     */
    page: number;
}
