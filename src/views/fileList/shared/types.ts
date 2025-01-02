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
export interface SettingInfo {
    /**
     * 倍率。1:原图，2:两倍图
     */
    pixel: 1 | 2;
    /**
     * 是否开启列表预览图片。1:预览，2:不预览
     */
    previewType: 1 | 2;
    /**
     * 自定义的复制样式模板ID，可编辑与选择
     */
    copyTemplateId: number;
    /**
     * 默认首页地址
     */
    homePath: string;
}
export interface AddParams {
    prefix: string;
    names: string;
    type: 'directory' | 'files';
}
export interface CollectItem {
    id: string;
    name: string;
    path: string;
}
export interface IPage {
    pageIndex: number;
    pageSize: number;
}
export interface TemplateItem {
    id: number;
    name: string;
    content: string;
}
