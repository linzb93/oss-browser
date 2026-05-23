# 功能：目录下载

**日期**：2026-05-03
**状态**：计划中
**模块归属**：download

## 背景 / Context

现有 `download` 函数（`src/main/modules/oss/adapter/Ali/Impl.ts:184-210`）虽然能通过检测路径是否以 `/` 结尾来区分目录和文件，但 `dir` 的计算方式对目录场景存在 bug：

```typescript
const dir = dirname(pathList[0].replace(`${account.domain}/`, ''));
```

当传入 `photos/` 时，`dirname('photos/')` 返回 `.`，导致下载目录时保存路径不正确。

## 需求

- 用户在文件列表中右键点击目录，期望能一键下载整个目录（含子目录所有文件）
- 下载时需要保持 OSS 上的目录结构
- 支持目录以 `/` 结尾来识别目录类型
- 空目录应正常处理，不报错

## 方案对比

- 方案 A：在 `src/main/modules/oss/adapter/Ali/Impl.ts` 中新增 `downloadDirectory` 函数，专门处理目录下载
    - 优点：改动集中，逻辑清晰，与现有 `download` 方法解耦
    - 缺点：需要新增 IPC 通道或在前端增加调用入口
- 方案 B：修改现有 `download` 函数，增加目录下载分支逻辑
    - 优点：无需新增函数，一处改动
    - 缺点：职责混合，违背单一职责原则

## 最终实现方案

- 选定方案：A
- IPC 通道设计：
    - 复用现有 `oss:download` 通道，或新增 `oss:download-directory` 通道
    - 参数结构：`{ paths: string }`（paths 为逗号分隔的目录路径列表）
- 前端钩子设计：
    - 位置：`src/renderer/hooks/service/useOSS.ts` 或新增 `useDownload.ts`
    - 导出接口：`downloadDirectory(paths: string): Promise<void>`
- 行为说明：
    - 正常流程：弹出系统保存目录对话框，用户选择后开始下载
    - 错误处理：账户不存在时抛出异常，空目录直接返回
- 与现有功能的兼容性：
    - 现有 `download` 方法不受影响
    - 目录下载复用自己的路径处理逻辑，不走原 `download` 方法

## 修改点一览（设计层面）

- 主进程：
    - `src/main/modules/oss/adapter/Ali/Impl.ts` — 新增 `downloadDirectory` 方法
    - `src/main/modules/oss/oss.service.ts` — 增加目录下载的 IPC 处理逻辑（如需新通道）
- 渲染进程：
    - `src/renderer/hooks/service/useOSS.ts` 或新建 `src/renderer/hooks/service/useDownload.ts` — 新增目录下载钩子
    - `src/renderer/components/FileList.vue` 或右键菜单组件 — 增加"下载目录"入口
- 类型定义：
    - 如需新增 IPC 参数类型，在 `src/shared/types.ts` 中定义

## 代码分析

现有 `download` 方法（line 184-210）的问题在于 `dirname` 对末尾有 `/` 的路径处理不正确：

```typescript
// 现有代码
const dir = dirname(pathList[0].replace(`${account.domain}/`, ''));
// photos/ → dirname('photos/') → '.' ❌

// 正确做法
const dir = relativePath.replace(/\/$/, '');
// photos/ → 'photos' ✅
```

关键依赖：
- `getAllFileUnderDirectory`（line 100-120）：已实现，递归获取目录下所有 OSS 文件路径
- `utilService.download`（`src/main/modules/util/util.service.ts`）：已实现，批量下载核心逻辑，接收逗号分隔的 URL 列表

## 备注

- 目录下载的文件列表可能很大，需要考虑分页或并发限制
- `utilService.download` 内部已使用 `pMap` 并发下载，可承载一定量的文件
- 后续可考虑增加下载进度显示（当前 `utilService.download` 无进度回调）
