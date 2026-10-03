# IPC 通信协议

本文档记录了 `oss-browser` 项目中前端（渲染进程）与后端（主进程）的所有 IPC 通信频道 (Channel)、请求参数及响应结构。

> **约定**：所有请求通过 `ipcRenderer.invoke(channel, data)` 发起，主进程通过 `ipcMain.handle(channel, handler)` 响应。

## 1. 账号管理 (Account)

| Channel | 描述 | 请求参数 | 响应数据 (Promise) |
| :--- | :--- | :--- | :--- |
| `home-getList` | 获取所有已保存的账号列表 | 无 | `AccountItem[]` |
| `login-get` | 获取指定 ID 的账号详情 | `id: string` | `AccountItem` |
| `login-save` | 保存/更新账号信息 | `account: AccountItem` | `void` |
| `getDefaultAppId` | 获取默认登录账号 ID | 无 | `string` |
| `setDefaultAppId` | 设置默认登录账号 ID | `id: string` | `void` |

**数据结构参考**：
```typescript
interface AccountItem {
  id: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  name?: string; // 别名
}
```

## 2. OSS 操作 (OSS)

| Channel | 描述 | 请求参数 | 响应数据 (Promise) |
| :--- | :--- | :--- | :--- |
| `oss-get-list` | 获取指定目录下的文件列表 | `{ prefix: string, useToken?: boolean }` | `{ list: FileItem[], token?: string }` |
| `oss-delete` | 删除文件或目录 | `{ paths: string }` (多个路径用逗号分隔) | `string[]` (失败列表) |
| `oss-add-directory` | 创建目录 | `{ prefix: string, name: string }` | `void` |
| `oss:download` | 下载单文件、目录或批量文件 | `{ paths: string }`（逗号分隔的 OSS 对象 key，目录以 `/` 结尾） | `void`（下载由主进程后台执行，进度通过 `main-post` / `download-progress` 推送） |
| `oss-upload` | 上传文件 (通过 `ipcRenderer.send`) | `FormData` 或自定义对象 | (通过 `oss-upload-receiver` 事件回调进度) |
| `get-buckets` | 获取当前账号下的 Bucket 列表 | `config: OssConfig` | `{ name: string }[]` |
| `oss:copy-online-file` | 复制在线文件：把在线地址的文件以流的方式上传到指定目录（右键菜单「复制在线文件」触发） | `{ prefix: string, url: string, name?: string }` (`name` 为空时使用地址里的原文件名) | `void` |

**数据结构参考**：
```typescript
interface FileItem {
  name: string;
  path: string;
  size: number;
  url: string;
  type: 'file' | 'dir';
  lastModified: string;
}
```

### 2.1 主进程推送：下载进度

主进程通过 `main-post` 事件（`method: 'download-progress'`）推送下载进度，渲染层用 `handleMainPost('download-progress', cb)` 接收。与上传进度（`upload-progress`）同构。

```typescript
interface DownloadProgressPayload {
  /** downloading：下载中；download-finished：全部结束；download-canceled：用户取消选择保存目录 */
  type: 'downloading' | 'download-finished' | 'download-canceled';
  /** 文件明细，最多 200 条（超过时 truncated 为 true） */
  data: {
    /** OSS 对象 key，用于拼接在线地址 */
    key: string;
    /** 本地保存的相对路径（保留目录结构） */
    path: string;
    /** 总字节数，未知时为 0 */
    size: number;
    /** 已下载字节数 */
    loaded: number;
    /** 0 - 100 */
    progress: number;
    /** 是否已结束（成功或失败） */
    finished: boolean;
    /** 是否下载失败 */
    failed?: boolean;
  }[];
  /** 明细是否被截断 */
  truncated: boolean;
  /** 本地保存目录，未选择时为空串 */
  savedPath: string;
  total: number;
  finished: number;
  failed: number;
  /** 总体进度 0 - 100：按每个文件的完成度取平均，已结束的文件计 100 */
  percent: number;
}
```

说明：

- 下载过程中主进程按 `interval(1000)` 节流推送 `downloading`，全部结束后推送一次 `download-finished`。
- 选择保存目录被取消时推送 `download-canceled`；空目录（展开后没有文件）不发保存目录选择框，直接推送 `download-finished` 且 `data` 为空。
- 单个文件失败（非 200、写盘失败、30s 空闲超时等）只标记 `failed`，不影响其他文件，也不会让整批下载一直挂起。

## 3. 设置 (Setting)

| Channel | 描述 | 请求参数 | 响应数据 (Promise) |
| :--- | :--- | :--- | :--- |
| `get-setting` | 获取全局设置 | 无 | `SettingInfo` |
| `save-setting` | 保存全局设置 | `setting: SettingInfo` | `void` |
| `set-home` | 设置当前路径为默认首页 | `path: string` | `void` |

**数据结构参考**：
```typescript
interface SettingInfo {
  pixel: 1 | 2; // 图片倍率
  previewType: 1 | 2; // 列表预览图片开关
  copyTemplateId: number; // 默认复制模板ID
  copyWorkflowId: number; // 默认工作流ID
  homePath: string; // 默认首页路径
}
```

## 4. 收藏夹 (Collect)

| Channel | 描述 | 请求参数 | 响应数据 (Promise) |
| :--- | :--- | :--- | :--- |
| `get-collect` | 获取收藏列表 | 无 | `CollectItem[]` |
| `add-collect` | 添加当前路径到收藏夹 | `path: string` | `void` |
| `set-collect` | 更新整个收藏列表 (排序/重命名) | `list: CollectItem[]` | `void` |

## 5. 历史记录 (History)

| Channel | 描述 | 请求参数 | 响应数据 (Promise) |
| :--- | :--- | :--- | :--- |
| `get-history` | 分页获取上传历史 | `query: { pageIndex, pageSize }` | `{ list: HistoryItem[], totalCount }` |
| `remove-history` | 删除历史记录 | `ids: string[]` | `void` |

## 6. 模板与工作流 (Template & Workflow)

| Channel | 描述 | 请求参数 | 响应数据 (Promise) |
| :--- | :--- | :--- | :--- |
| `get-template` | 获取单个模板详情 | `id: number` | `TemplateItem` |
| `get-template-list` | 获取模板列表 (不含内容) | 无 | `TemplateItem[]` |
| `add-template` | 新增模板 | `template: Omit<TemplateItem, 'id'>` | `void` |
| `edit-template` | 编辑模板 | `template: TemplateItem` | `void` |
| `remove-template` | 删除模板 | `id: number` | `void` |
| `copy-template` | **核心功能**: 根据模板生成复制内容 | `{ width, height, url }` | `string` (生成的文本) |

## 7. 通用工具 (Util)

| Channel | 描述 | 请求参数 | 响应数据 (Promise) |
| :--- | :--- | :--- | :--- |
| `copy` | 复制文本到剪贴板 | `text: string` | `void` |
| `open` | 打开本地文件/目录/URL | `path: string` | `void` |

## 8. 扩展指南

新增 IPC 接口时，请遵循以下步骤：

1.  在 `electron/main/modules/` 下对应的 Controller 中添加处理函数。
2.  在 `electron/main/router.ts` 中注册 `ipcMain.handle`，并使用 `response()` 统一包装返回值。
3.  在 `src/views/fileList/api.ts` (或其他 api 文件) 中添加前端调用函数。
4.  **在此文档中添加新接口说明。**
