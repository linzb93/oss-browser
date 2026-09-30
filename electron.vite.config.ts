import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'electron-vite';

/**
 * 仓库根目录（本文件与 index.html 同级）。
 *
 * 这份配置由 electron-vite 按 ESM 执行（package.json 是 `type: module`），
 * 所以用 import.meta.url 推导目录，而不是 __dirname。
 */
const ROOT = dirname(fileURLToPath(import.meta.url));

/** 渲染进程开发服务器地址（主进程靠 VITE_DEV_SERVER_URL 找到它） */
const DEV_SERVER_HOST = '127.0.0.1';
const DEV_SERVER_PORT = 3344;
const DEV_SERVER_URL = `http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}/`;

const alias = {
    '@': resolve(ROOT, 'src'),
};

/**
 * 三份配置的产物路径刻意保持与旧构建一致，因为 src 目录不允许改动：
 *
 * - `dist-electron/main/index.js` → package.json#main 与 `<root>/dist-electron`（constants/path.ts）
 * - `dist-electron/preload/index.mjs` → `<root>/dist-electron/preload/index.mjs`（bootstrap/lifecycle.ts）
 * - `dist/` → `<root>/dist/index.html`（constants/path.ts 的 RENDERER_DIST）
 *
 * 也就是说：这里只替换构建工具，不改动产物布局。
 */
export default defineConfig(({ command, mode }) => {
    const isServe = command === 'serve';
    const isReport = mode === 'report';

    if (isServe) {
        // 开发模式下主进程需要知道渲染进程开发服务器的地址。
        // src/main/shared/constants/path.ts 读取的是 process.env.VITE_DEV_SERVER_URL，
        // 而 electron-vite 注入的是 ELECTRON_RENDERER_URL；由于 Electron 子进程
        // 会继承当前进程的环境变量，这里补一个同名变量即可，src 保持零改动。
        process.env.VITE_DEV_SERVER_URL ||= DEV_SERVER_URL;
    }

    return {
        // 主进程（Node 环境，ESM 输出）
        main: {
            resolve: { alias },
            build: {
                outDir: resolve(ROOT, 'dist-electron/main'),
                sourcemap: isServe,
                minify: false,
                // 生产依赖保持 external（运行时从 node_modules 加载），
                // electron-builder 会把 dependencies 自动打进安装包。
                externalizeDeps: true,
                rollupOptions: {
                    input: { index: resolve(ROOT, 'src/main/bootstrap/index.ts') },
                },
            },
        },

        // 预加载脚本
        preload: {
            resolve: { alias },
            build: {
                outDir: resolve(ROOT, 'dist-electron/preload'),
                sourcemap: isServe ? 'inline' : false,
                minify: false,
                // 渲染进程使用 Electron 默认的沙箱（src 没有设置 sandbox: false）。
                // 沙箱化的 preload 只能是 CommonJS、只能 require Electron 内置模块，
                // 因此关闭依赖外部化，把第三方依赖内联进来。
                externalizeDeps: false,
                rollupOptions: {
                    input: { index: resolve(ROOT, 'src/main/preload/index.ts') },
                    output: {
                        // 内容必须是 CJS：沙箱 preload 不做 ESM 处理，
                        // 打包产物（release/2.1.0 的 app.asar）也是这个形态。
                        format: 'cjs',
                        // 文件名保持 .mjs：src/main/bootstrap/lifecycle.ts 按
                        // `../preload/index.mjs` 引用，且沙箱下按内容而非扩展名执行。
                        entryFileNames: '[name].mjs',
                    },
                },
            },
        },

        // 渲染进程（Vue 3）
        renderer: {
            // 沿用仓库根目录的 index.html：root 指向项目根，产物仍在 dist/
            root: ROOT,
            resolve: { alias },
            // 与旧构建保持一致：不要把终端日志清空
            clearScreen: false,
            plugins: [
                vue(),
                // 仅 `npm run build:report` 时生成体积分析报告
                isReport &&
                    visualizer({
                        open: true, // 打包完成后自动打开分析页面
                        filename: 'stats.renderer.html',
                        gzipSize: true,
                        brotliSize: true,
                        title: 'Bundle Analysis - renderer',
                    }),
            ],
            build: {
                outDir: resolve(ROOT, 'dist'),
                // electron-vite 渲染进程的默认值是 minify: false，
                // 这里显式打开压缩，保持与旧构建（vite build 默认 esbuild 压缩）一致。
                minify: 'esbuild',
                rollupOptions: {
                    input: { index: resolve(ROOT, 'index.html') },
                    // 需要手动分包时可在这里加 output.manualChunks，
                    // 例如把 vue / element-plus 拆成独立 chunk。
                },
            },
            server: {
                host: DEV_SERVER_HOST,
                port: DEV_SERVER_PORT,
                // 端口被占用时直接失败，避免主进程加载到错误的地址
                strictPort: true,
            },
        },
    };
});
