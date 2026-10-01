/**
 * 构建产物的目录结构（electron.vite.config.ts 决定）
 *
 * ```tree
 * ├─┬ dist-electron
 * │ ├─┬ main
 * │ │ └── index.js    > Electron-Main
 * │ └─┬ preload
 * │   └── index.mjs   > Preload-Scripts
 * ├─┬ dist
 * │ └── index.html    > Electron-Renderer
 * ```
 */
declare namespace NodeJS {
    interface ProcessEnv {
    /**
     * 渲染进程开发服务器地址，仅在开发模式下由 electron.vite.config.ts 注入；
     * 生产环境为 undefined（见 src/main/shared/constants/path.ts）。
     */
        VITE_DEV_SERVER_URL?: string
        /** electron-vite 注入的渲染进程地址（开发模式） */
        ELECTRON_RENDERER_URL?: string
    }
}
