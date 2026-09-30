# 构建与工具链说明

> 本文档说明本项目当前的构建体系。工具选型参照 [PicGo](https://github.com/Molunerfinn/PicGo) 的 electron-vite 方案，
> 但保留了本项目自身的约定：**npm** 作为包管理器、**standard-version** 作为发版工具、**sass + Element Plus** 的样式方案
> （因此没有引入 postcss / tailwind）。

## 1. 工具链总览

| 用途             | 工具                              | 配置文件                     |
| :--------------- | :-------------------------------- | :--------------------------- |
| 开发 / 构建      | electron-vite 5                   | `electron.vite.config.ts`    |
| 打包安装包       | electron-builder 26（TS 配置）    | `electron-builder.config.ts` |
| 类型检查         | vue-tsc / tsc                     | `tsconfig.json`              |
| 代码规范         | ESLint 9（flat config）           | `eslint.config.js`           |
| 循环依赖检查     | dpdm                              | `package.json` 中的 scripts  |
| 单元测试         | Vitest 4                          | `vitest.config.ts`           |
| 提交规范         | husky 9 + commitlint              | `commitlint.config.js`、`.husky/` |
| 版本与 CHANGELOG | standard-version                  | `package.json` 中的 scripts  |
| 打包体积分析     | rollup-plugin-visualizer（可选）  | `electron.vite.config.ts`    |

## 2. 常用命令

```bash
npm install          # 安装依赖
npm run dev          # 启动开发环境（渲染进程 dev server + Electron 主进程）
npm run dev:debug    # 带调试端口的开发环境（见第 6 节）

npm run build        # 只构建产物（dist + dist-electron）
npm run build:win    # 构建并打包 Windows 安装包
npm run build:mac    # 构建并打包 macOS 安装包
npm run build:linux  # 构建并打包 Linux 安装包
npm run build:app    # 不重新构建，直接用已有产物打包
npm run build:report # 构建并生成体积分析报告 stats.renderer.html
npm run preview      # 用构建产物启动 Electron

npm run tsc          # tsc --noEmit
npm run vue-tsc      # vue-tsc --noEmit（含 .vue 模板）
npm run lint         # dpdm 循环依赖检查 + eslint
npm run lint:fix     # eslint --fix
npm run check        # vue-tsc + eslint --fix（pre-commit 会执行）
npm run test         # vitest run
npm run release      # standard-version 发版
```

## 3. 产物目录（**不要改动**）

```
├─┬ dist-electron
│ ├─┬ main
│ │ └── index.js    > Electron 主进程（package.json#main）
│ └─┬ preload
│   └── index.mjs   > 预加载脚本
├─┬ dist
│ └── index.html    > 渲染进程
└─ release/<version>/ > electron-builder 的安装包输出
```

这些路径被 `src` 目录硬编码引用，因此 `electron.vite.config.ts` 里的 `outDir` 必须保持上面的结构：

- `src/main/shared/constants/path.ts`：`RENDERER_DIST = <root>/dist`、`MAIN_DIST = <root>/dist-electron`
- `src/main/bootstrap/lifecycle.ts`：`preload = join(__dirname, '../preload/index.mjs')`
- `package.json`：`"main": "dist-electron/main/index.js"`

## 4. 三个进程的构建要点

### 4.1 主进程（main）

- 入口：`src/main/bootstrap/index.ts`，产物：`dist-electron/main/index.js`
- 因为 `package.json` 是 `"type": "module"`，electron-vite 会输出 **ESM**（Electron ≥ 28 支持）
- `build.externalizeDeps: true`：第三方依赖保持 external，运行时从 `node_modules` 加载；
  electron-builder 会自动把 `dependencies` 收集进安装包

### 4.2 预加载脚本（preload）

- 入口：`src/main/preload/index.ts`，产物：`dist-electron/preload/index.mjs`
- **内容是 CommonJS，文件名是 `.mjs`**：
    - 渲染进程使用 Electron 默认的沙箱（`lifecycle.ts` 没有设置 `sandbox: false`），Electron 要求沙箱化的
      preload 必须是 CommonJS、只能 `require` Electron 内置模块，因此这里固定 `format: 'cjs'` 并关闭依赖外部化
    - 文件名必须叫 `index.mjs`，因为 `lifecycle.ts` 就是这么引用的。沙箱 preload 按**内容**而不是扩展名执行，
      所以「CJS 内容 + .mjs 文件名」可以正常工作（`release/2.1.0` 的安装包里也是这个形态）
- 后续如果想改成标准写法（`index.cjs`），需要同时修改 `src/main/bootstrap/lifecycle.ts`，属于 `src` 的改动

### 4.3 渲染进程（renderer）

- `root` 指向仓库根目录：`index.html` 与 `public/` 都在根目录，这点与 electron-vite 默认的 `src/renderer` 布局不同
- 产物：`dist/`；`public/` 会被自动拷贝到 `dist/`
- 插件：`@vitejs/plugin-vue`；模板/脚本用 `@` 别名指向 `src`（与 `tsconfig.json` 的 `paths` 一致）

## 5. 开发模式下的地址注入

`src` 判断是否处于开发模式的方式是读取环境变量：

```ts
// src/main/shared/constants/path.ts
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
```

而 electron-vite 注入的变量名是 `ELECTRON_RENDERER_URL`。为了不改动 `src`，`electron.vite.config.ts` 在
`serve` 模式下补写了一个同名变量（Electron 子进程会继承当前进程的环境变量）：

```ts
process.env.VITE_DEV_SERVER_URL ||= 'http://127.0.0.1:3344/';
```

同时渲染进程 dev server 固定使用 `127.0.0.1:3344` 并开启 `strictPort`，保证地址不会漂移。
如果以后允许修改 `src`，可以直接改用 `ELECTRON_RENDERER_URL` 并删掉这段兼容逻辑。

## 6. 调试

命令行：

```bash
npm run dev:debug
# 等价于 electron-vite dev --watch --inspect=5858 --remoteDebuggingPort=9229
```

- `--watch`：主进程 / preload 变化后自动重建并重启
- `--inspect=5858`：主进程 V8 inspector
- `--remoteDebuggingPort=9229`：渲染进程远程调试端口

VS Code：直接按 F5 选择 **Debug App**（`.vscode/launch.json` 的 compound 会先通过
`.vscode/tasks.json` 里的后台任务启动 `npm run dev:debug`，再附加主进程与渲染进程调试器）。

## 7. 代码规范与提交

- 规范由 `eslint.config.js`（ESLint 9 flat config）统一负责，已不再使用 oxlint / oxfmt / prettier / lint-staged；
  缩进保持 **4 空格 + 分号**，与仓库现有代码一致
- `.vue` 的排版类规则（`vue/html-indent`、`vue/max-attributes-per-line`、`vue/block-order` 等）被显式关闭，
  因为现有组件是「template 在前 + 4 空格 + 单行多属性」的手写风格，开启后会让 `eslint --fix` 大面积重排模板
- 提交信息由 commitlint 校验（`feat: xxx` / `fix: xxx`），发版使用 `npm run release`（standard-version）
- husky 钩子：
    - `pre-commit`：`npm run check`（vue-tsc + eslint --fix）+ `npm run lint:dpdm`
    - `commit-msg`：commitlint
    - `pre-push`：`npm run test`

> 首次执行 `npm run check` / `npm run lint:fix` 时，ESLint 会按上面的风格规则自动调整以下三个文件（**纯缩进调整，无逻辑改动**）：
> `src/renderer/components/icons/index.ts`、`src/renderer/vite-env.d.ts`、`src/main/electron-env.d.ts`
> —— 它们是模板遗留的 2 空格缩进。`.vue` 模板里的 HTML 缩进不受影响（`vue/html-indent` 已关闭）。

## 8. 测试

- 配置文件：`vitest.config.ts`（与 `electron.vite.config.ts` 相互独立，Vitest 不会加载后者）
- 默认环境是 `node`；需要 DOM 的组件测试，在文件顶部声明 `// @vitest-environment jsdom`
  （Vitest 4 已移除 `environmentMatchGlobs`，改为按文件声明）
- 测试文件与被测代码同级，命名为 `*.test.ts` / `*.spec.ts`，写法参考 [test-builder.md](./test-builder.md)

## 9. 与 PicGo 方案的差异

| 项目              | PicGo                     | 本项目                          | 原因                                     |
| :---------------- | :------------------------ | :------------------------------ | :--------------------------------------- |
| 包管理器          | pnpm                      | npm                             | 团队约定（见 guide.md 的 FAQ）           |
| 样式方案          | postcss + tailwind        | sass + Element Plus             | 现有样式体系无需 tailwind                |
| 渲染层框架        | React + shadcn            | Vue 3 + Element Plus            | 沿用现有技术栈                           |
| 发版工具          | @picgo/bump-version       | standard-version                | 保留现有发版流程                         |
| 组件测试库        | @testing-library/react    | @vue/test-utils + jsdom         | Vue 对应方案                             |
| 打包体积分析      | 无                        | rollup-plugin-visualizer        | 保留原有的 `build:report` 能力           |

## 10. 从旧构建迁移的注意点

- 旧的 `vite.config.ts`（`vite-plugin-electron` 的 multi-env 写法）已删除，其中的 `normalizeModuleIds`、
  `diagLoadIds` 以及 `fs.rmSync('dist-electron')` 一并移除
- 旧的 `electron-builder.json5` + `scripts/electron-builder.mjs` 合并为 `electron-builder.config.ts`
  （镜像设置、`CSC_IDENTITY_AUTO_DISCOVERY`、macOS 图标预检都放在配置里，打包开始时执行一次）
- `src/main/electron-env.d.ts` 里原本 `/// <reference types="vite-plugin-electron/electron-env" />`
  这一行随插件一起删除了（仅此一处 `src` 改动）
- 如果再次遇到「同一个文件被打包两份、模块级状态被复制」的现象，优先检查 alias 与相对路径是否被解析成了
  两种不同的模块 id（electron-vite 由 Vite 的解析器统一产出 POSIX 风格的 id，正常情况下不会再出现）

## 11. 迁移后建议的验证顺序

```bash
npm install
npm run lint          # 检查规范与循环依赖
npm run vue-tsc       # 类型检查
npm run test          # 单元测试（当前仓库还没有测试用例）
npm run dev           # 开发模式：窗口能正常加载 dev server，IPC 正常
npm run build:win     # 打包并安装，确认 preload / 主进程路径正常
```
