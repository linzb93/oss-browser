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
     * 在线地址
     */
    url: string;
    /**
     * 文件类型
     */
    type?: string;
}
export type ResponseTableItem = Pick<TableItem, 'name' | 'type' | 'size'>;
export type UploadedTableItem = ResponseTableItem & Pick<TableItem, 'path'>;
export interface AddParams {
    prefix: string;
    names: string;
    type: 'directory' | 'files';
}
