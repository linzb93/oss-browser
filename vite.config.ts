import fs from 'node:fs';
import { isAbsolute } from 'node:path';
import { defineConfig, normalizePath, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { electronSimple } from 'vite-plugin-electron/multi-env';
import { notBundle } from 'vite-plugin-electron/plugin';
import pkg from './package.json' with { type: 'json' };
import { fileURLToPath, URL } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

// Set third-party env vars from package.json#config per npm docs recommendation
if (pkg.config) {
    process.env.ELECTRON_MIRROR ||= pkg.config.electron_mirror;
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||= pkg.config.electron_builder_binaries_mirror;
}

/**
 * 项目根目录的绝对路径（POSIX 风格），以本配置文件的真实路径为基准计算。
 *
 * 主进程/预加载入口若写成相对路径，会由 `process.cwd()` 解析；而 alias 用的是
 * `import.meta.url`。两者的路径拼写可能不一致（Windows 路径不区分大小写，从
 * 大小写不同的目录启动构建时尤其明显），rolldown 按模块 id 字符串去重，于是
 * 同一个文件会被解析成两个模块、打包两份，模块级状态也跟着复制两份。
 * 因此这里统一用同一份绝对路径派生出 alias 与各个入口，保证 id 完全一致。
 */
const APP_ROOT = normalizePath(fs.realpathSync.native(fileURLToPath(new URL('.', import.meta.url))));
const MAIN_ENTRY = `${APP_ROOT}/src/main/bootstrap/index.ts`;
const PRELOAD_ENTRY = `${APP_ROOT}/src/main/preload/index.ts`;

/** 临时诊断插件：打印真正被打包进来的模块 id */
const diagLoadIds = {
    name: 'diag-load-ids',
    load(id: string) {
        if (/window\.service|history\.service|infra[\\/]sql|constants[\\/]path/.test(id)) {
            console.log('[DIAG-ID]', id);
        }
        return null;
    },
};

/**
 * 统一模块 id 的写法，避免同一个文件被打包两份。
 *
 * 同一个文件可能从两条路被解析出来：`@` 别名给出的是 POSIX 风格路径
 * （`D:/x/src/main/...`），而相对路径由 Node 解析出的是 Windows 原生路径
 * （`D:\x\src\main\...`）。rolldown 按模块 id 字符串去重，两种写法会被当成两个
 * 模块，于是模块级变量跟着复制两份——例如 `window.service.ts` 里的 `win`：
 * `setWindow()` 写入的是其中一份，`postRenderer()` 读的是另一份，运行时就变成
 * `undefined`。
 *
 * 这里在解析阶段把所有落到磁盘上的绝对路径统一成「真实路径 + POSIX 分隔符」，
 * 同一个文件从此只有一个 id。开发（serve）与构建（build）都会走到这个钩子。
 */
const normalizeModuleIds: Plugin = {
    name: 'normalize-module-ids',
    enforce: 'pre',
    async resolveId(source, importer, options) {
        const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
        // 虚拟模块、外部依赖（electron / ali-oss 等）保持原样
        if (!resolved || resolved.external || !isAbsolute(resolved.id)) {
            return null;
        }

        let id = resolved.id;
        try {
            // 顺带统一盘符/目录名大小写（Windows 路径不区分大小写）与软链接
            id = fs.realpathSync.native(id);
        } catch {
            // 文件尚不存在时保持原样
        }

        const normalized = normalizePath(id);
        return normalized === resolved.id ? null : { ...resolved, id: normalized };
    },
};

/**
 * 为不同进程分别生成构建分析报告。
 * 仅在 `MODE=report`（`pnpm run build:report`）时启用，避免常规构建产生额外文件和开销。
 */
const visualizerPlugin = (processName: string) =>
    process.env.MODE === 'report'
        ? visualizer({
              open: true, // true 打包完自动打开分析页面，false 不会自动弹出
              filename: `stats.${processName}.html`, // 分析图生成的文件名，主/渲染进程各一份
              gzipSize: true, // 是否统计并显示gzip
              brotliSize: true, // 是否统计并显示brotli
              title: `Bundle Analysis - ${processName}`,
          })
        : null;

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    fs.rmSync('dist-electron', { recursive: true, force: true });

    const isServe = command === 'serve';
    const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

    return {
        define: {
            'process.platform': JSON.stringify(process.platform),
        },
        resolve: {
            alias: {
                '@': `${APP_ROOT}/src`,
            },
        },
        plugins: [
            normalizeModuleIds,
            diagLoadIds,
            vue(),
            electronSimple({
                main: {
                    // Shortcut of `options.build.rolldownOptions.input`
                    // (`options.build.rollupOptions.input` on Vite < 8)
                    input: {
                        index: MAIN_ENTRY,
                    },
                    onstart({ startup }) {
                        if (process.env.VSCODE_DEBUG) {
                            console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App');
                        } else {
                            startup();
                        }
                    },
                    plugins: [normalizeModuleIds, notBundle(), diagLoadIds],
                    options: {
                        define: {
                            'process.platform': JSON.stringify(process.platform),
                        },
                        build: {
                            sourcemap,
                            minify: false,
                            outDir: 'dist-electron/main',
                        },
                    },
                },
                preload: {
                    // Shortcut of `options.build.rolldownOptions.input`.
                    // Preload scripts may contain Web assets, so use the `.input` instead of the lib `entry`.
                    input: PRELOAD_ENTRY,
                    plugins: [normalizeModuleIds, notBundle()],
                    options: {
                        build: {
                            sourcemap: sourcemap ? 'inline' : undefined, // #332
                            minify: false,
                            outDir: 'dist-electron/preload',
                        },
                    },
                },
                // Ployfill the Electron and Node.js API for Renderer process.
                // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
                // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
                // Note: the `renderer` preset is not supported by the multi-env API,
                // and is no longer needed by this project.
            }),
            visualizerPlugin('renderer'),
        ],
        server: process.env.VSCODE_DEBUG
            ? (() => {
                const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
                return {
                    host: url.hostname,
                    port: +url.port,
                };
            })()
            : undefined,
        // build: {
        //     rollupOptions: {
        //         output: {
        //             manualChunks: {
        //                 vue: ['vue'],
        //                 'element-plus': ['element-plus'],
        //             } as never,
        //         },
        //     },
        // },
        clearScreen: false,
    };
});
