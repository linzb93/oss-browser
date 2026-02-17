# 开发与扩展指南

本文档将手把手指导你如何进行日常开发、调试、新增功能以及构建发布。

## 1. 环境准备

### 1.1 系统要求

- Node.js: >= 20.0 (推荐 LTS 版本)
- 包管理器: npm
- 操作系统: macOS (推荐), Windows

### 1.2 安装依赖

在项目根目录下执行：

```bash
npm install
```

### 1.3 启动开发服务器

```bash
npm run dev
```

此命令将同时启动：

- Vite 开发服务器 (http://localhost:3344)
- Electron 主进程 (自动加载 dist-electron/main/index.js)

## 2. 调试技巧

### 2.1 主进程调试

- 在 VS Code 中配置 `launch.json`，使用 "Attach to Main Process" 配置。
- 或者直接在终端输出日志，Electron 控制台会显示主进程的 `console.log`。

### 2.2 渲染进程调试

- Electron 窗口默认开启开发者工具 (DevTools)。
- 按 `F12` 或 `Cmd+Option+I` (macOS) 打开控制台。
- 支持 Vue Devtools 插件（需手动配置加载或在 Electron 中安装）。

## 3. 如何新增一个功能

假设我们要新增一个 **"文件重命名"** 功能，步骤如下：

### 第一步：后端 (主进程)

1.  **定义接口**: 在 `electron/main/modules/oss/oss.service.ts` 中添加 `renameFile` 方法。
    ```typescript
    // electron/main/modules/oss/oss.service.ts
    export async function renameFile(oldPath: string, newPath: string) {
        // 调用 OSS SDK 实现重命名 (通常是 copy + delete)
        await currentApp.copy(oldPath, newPath);
        await currentApp.delete(oldPath);
    }
    ```
2.  **注册 IPC**: 在 `electron/main/modules/oss/oss.controller.ts` 中添加调用逻辑，并在 `electron/main/router.ts` 中注册路由。
    ```typescript
    // electron/main/router.ts
    ipcMain.handle('oss-rename', (_, { oldPath, newPath }) => {
        return response(async () => await ossController.renameFile(oldPath, newPath));
    });
    ```

### 第二步：前端 (渲染进程)

1.  **封装 API**: 在 `src/views/fileList/api.ts` 中添加函数。
    ```typescript
    // src/views/fileList/api.ts
    export function renameFile(data: { oldPath: string; newPath: string }) {
        return request('oss-rename', data);
    }
    ```
2.  **编写 Hook**: 在 `src/views/fileList/hooks/useOss.ts` (或新建 hook) 中调用 API。
    ```typescript
    const doRename = async (item: FileItem) => {
        const newName = await ElMessageBox.prompt('请输入新文件名', '重命名', { inputValue: item.name });
        if (newName.value) {
            await api.renameFile({ oldPath: item.path, newPath: ... });
            ElMessage.success('重命名成功');
            refreshList(); // 刷新列表
        }
    };
    ```
3.  **UI 绑定**: 在 `src/views/fileList/components/FileList.vue` 的右键菜单或操作栏中绑定 `doRename` 事件。

### 第三步：更新文档

- 在 `docs/ipc.md` 中添加 `oss-rename` 接口说明。

## 4. 构建与发布

### 4.1 构建生产包

```bash
npm run build
```

此命令会执行 `vue-tsc` 类型检查、`vite build` 打包前端资源，最后使用 `electron-builder` 打包出对应平台的安装包（如 `.dmg`, `.exe`）。

### 4.2 常见构建问题

- **依赖缺失**: 确保 `dependencies` 中包含了所有运行时需要的包（如 `ali-oss`, `fs-extra`），`devDependencies` 仅包含构建工具。
- **静态资源丢失**: 检查 `public/` 目录下的资源引用路径是否正确。
- **原生模块**: 如果使用了 C++ 编写的原生模块，可能需要 `electron-rebuild`。

## 5. 代码规范

- **命名**:
    - 文件夹/文件：小驼峰 (camelCase) 或 kebab-case，Vue 组件推荐大驼峰 (PascalCase)。
    - 变量/函数：小驼峰 (camelCase)。
    - 常量：全大写下划线 (UPPER_CASE)。
- **注释**:
    - 核心逻辑必须写注释。
    - 接口方法使用 JSDoc 风格注释。
- **Git 提交**:
    - 遵循 Conventional Commits 规范 (e.g., `feat: add rename function`, `fix: bug in upload`).

## 6. 常见问题 (FAQ)

- **Q: 为什么修改了主进程代码没生效？**
    - A: 主进程代码修改后通常需要重启应用（`npm run dev` 会自动重启 Electron，但有时可能失效，手动重启试试）。

- **Q: 前端请求 IPC 报错 "No handler registered for..."？**
    - A: 检查 `electron/main/router.ts` 中是否真的注册了该 channel，拼写是否一致。

- **Q: 为什么包管理使用npm而不是pnpm？**
    - A: 因为 pnpm 存在一些已知问题，如在 Electron 中使用时可能会导致依赖解析错误。npm 是 Node.js 官方推荐的包管理器，使用起来更加稳定。
- **Q: 为何将前端逻辑大量封装成hooks调用？**
    - A: 因为文件列表页面逻辑比较复杂，直接在组件中调用会导致维护困难。封装成 hooks 可以方便修改，同时也方便测试。
