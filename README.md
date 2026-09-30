# OSS Browser

OSS 客户端。目前只支持阿里 OSS。支持的平台包括 Windows 10+ 和 macOS。

## 功能特性

- **文件管理**：支持文件列表展示、文件上传、下载、删除及新建文件夹。
- **在线预览**：支持图片和文本文件的在线预览。
- **自定义模板**：支持自定义复制格式（如 Markdown、HTML 等），可动态替换文件 URL、宽高信息，方便快速获取代码片段。
- **自动化工作流**：专为批量上传设计，支持自动重命名（索引、UID 等）及上传后自动生成结果数据。
- **图片对比**：提供线上图片与本地图片的视觉对比功能，方便确认变更差异。
- **目录收藏**：支持收藏常用目录，实现快速跳转。
- **上传历史**：记录上传过的文件历史。
- **个性化设置**：支持配置图片倍数、预览模式等。

## 开发

```bash
npm install       # 安装依赖

npm run dev       # 开发模式（渲染进程 dev server + Electron 主进程）
npm run dev:debug # 带调试端口的开发模式（VS Code 直接 F5 选择 Debug App）

npm run build     # 只构建产物（dist/ 与 dist-electron/）
npm run build:win # 构建并打包 Windows 安装包（mac/linux 同理）

npm run lint      # ESLint + 循环依赖检查
npm run test      # Vitest 单元测试
```

- 构建体系：electron-vite + electron-builder（说明见 [docs/build.md](docs/build.md)）
- 开发与扩展指南：[docs/guide.md](docs/guide.md)
- 架构说明：[docs/architecture.md](docs/architecture.md)
- IPC 协议：[docs/ipc.md](docs/ipc.md)
- 测试编写：[docs/test-builder.md](docs/test-builder.md)
