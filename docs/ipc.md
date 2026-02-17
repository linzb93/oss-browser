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
| `oss-download` | 下载文件 | `paths: string` (多个路径用逗号分隔) | `void` (下载由主进程后台执行) |
| `oss-upload` | 上传文件 (通过 `ipcRenderer.send`) | `FormData` 或自定义对象 | (通过 `oss-upload-receiver` 事件回调进度) |
| `get-buckets` | 获取当前账号下的 Bucket 列表 | `config: OssConfig` | `{ name: string }[]` |

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
