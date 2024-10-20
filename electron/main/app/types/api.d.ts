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
    domain?: string;
  };
  collect: {
    id: string;
    name: string;
    path: string;
  }[];
  setting: {
    id: number;
    accountId: number;
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
  };
  history: {
    path: string;
    createTime: string;
  }[];
}
