export interface TableItem {
    name: string;
    path: string;
    size: number;
    sizeFormat: string;
    url: string;
    type?: string;
}
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
