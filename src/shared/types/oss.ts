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
 * 单个文件的下载进度
 */
export interface DownloadProgressItem {
    /**
     * OSS 对象 key，用于拼接在线地址
     */
    key: string;
    /**
     * 本地相对路径（保留 OSS 目录结构）
     */
    path: string;
    /**
     * 文件总字节数，未知时为 0
     */
    size: number;
    /**
     * 已下载字节数
     */
    loaded: number;
    /**
     * 下载进度，0 - 100
     */
    progress: number;
    /**
     * 是否已结束（成功或失败）
     */
    finished: boolean;
    /**
     * 是否下载失败
     */
    failed?: boolean;
}

/**
 * 主进程通过 `main-post` / `download-progress` 推送的下载进度消息
 */
export interface DownloadProgressPayload {
    /**
     * downloading：下载中；download-finished：全部结束；download-canceled：用户取消选择保存目录
     */
    type: 'downloading' | 'download-finished' | 'download-canceled';
    /**
     * 文件明细，最多 200 条（超出时由 truncated 标记）
     */
    data: DownloadProgressItem[];
    /**
     * 明细是否被截断
     */
    truncated: boolean;
    /**
     * 本地保存目录，未选择时为空串
     */
    savedPath: string;
    /**
     * 文件总数
     */
    total: number;
    /**
     * 已结束（含失败）数量
     */
    finished: number;
    /**
     * 失败数量
     */
    failed: number;
    /**
     * 总体进度 0 - 100：按每个文件的完成度取平均，已结束的文件计 100
     */
    percent: number;
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
