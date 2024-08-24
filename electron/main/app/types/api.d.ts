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
    domain?: string;
    setting?: {
      shortcut: string;
      pixel: 1 | 2;
      platform: 1 | 2;
      previewType: 1 | 2;
      fasterEnter: 0 | 1;
    };
  }[];
  history: {
    path: string;
    createTime: string;
  }[];
}
