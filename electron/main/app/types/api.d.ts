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
  setting: [
    {
      id: number;
      accountId: number;
      pixel: 1 | 2;
      platform: 1 | 2;
      openPreview: boolean;
    }
  ];
  history: {
    path: string;
    createTime: string;
  }[];
}
