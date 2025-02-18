interface AnyObject {
    [key: string]: any;
}

export interface Request<T = AnyObject> {
    params: T;
    path: string;
}

export interface Database {
    accounts: {
        id: number;
        platform?: number;
        name?: string;
        domain: string;
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
    }[];
    defaultAppId: number;
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
         * 1: 否；2: 是
         */
        previewType: 1 | 2;
        /**
         * 首页地址
         */
        homePath: string;
        /**
         * 复制模板ID
         */
        copyTemplateId: number;
        /**
         * 复制工作流ID
         */
        copyWorkflowId: number;
    };
    history: {
        path: string;
        createTime: string;
    }[];
    workflow: {
        id: number;
        name: string;
        nameType: 'index' | 'uid' | 'originName';
        templateContent: string;
        templateType: 'plainText' | 'json';
    }[];
}
