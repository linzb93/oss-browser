export interface CollectItem {
    id: string;
    /**
     * 名称，可自定义，默认用目录最后一级的名称
     */
    name: string;
    /**
     * 完整路径
     */
    path: string;
}
