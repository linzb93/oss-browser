export interface TableItem {
    name: string;
    path: string;
    size: number;
    sizeFormat: string;
    url: string;
    type?: string;
}
export interface SettingInfo {
    pixel: number;
    previewType: 1 | 2;
    copyTemplateId: number;
    homePath: string;
}
