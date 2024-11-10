interface AnyObject {
    [key: string]: any;
}

export interface Request<T = AnyObject> {
    params: T;
    path: string;
}

export interface Database {
    account: {
        id: number;
        platform?: number;
        name?: string;
        domain: string;
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
    };
    collect: {
        id: string;
        /**
         * 名称，可自定义，默认用目录最后一级的名称
         */
        name: string;
        /**
         * 完整路径
         */
        path: string;
    }[];
    templates: {
        name: string;
        content: string;
        id: number;
    }[];
    setting: {
        /**
         * 1: 一倍图；2: 两倍图
         */
        pixel: 1 | 2;
        /**
         * 是否显示图片预览
         * @default false
         */
        openPreview: boolean;
        /**
         * 首页地址
         */
        homePath: string;
        /**
         * 复制模板ID
         */
        copyTemplateId: number;
    };
    history: {
        path: string;
        createTime: string;
    }[];
}
