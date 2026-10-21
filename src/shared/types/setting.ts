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
     * * @default 0 - 表示不复制。
     */
    copyTemplateId: number;
    /**
     * 默认首页地址
     */
    homePath: string;
    /**
     * 上传完成后是否删除源文件
     */
    deleteSourceFile: boolean;
    /**
     * 上传完成后是否询问用户是否删除源文件。
     * 用户在设置中主动把「上传完成后删除源文件」设为「否」后，不再询问。
     */
    askDeleteSourceFile: boolean;
}
