import fs from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron/simple';
import pkg from './package.json' with { type: 'json' };
import { fileURLToPath, URL } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

// Set third-party env vars from package.json#config per npm docs recommendation
if (pkg.config) {
    process.env.ELECTRON_MIRROR ||= pkg.config.electron_mirror;
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||= pkg.config.electron_builder_binaries_mirror;
}

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

/**
 * 将主进程里的 node_modules 依赖标记为 external，确保产物保留裸模块名（如 `import "uuid"`），
 * 而不是被打包进文件、或被写成指向 node_modules 的绝对/相对路径。
 * 仅对主进程构建生效（preload 与 renderer 不受影响）。
 */
const externalizeNodeModulesPlugin = (): Plugin => ({
    name: 'externalize-node-modules',
    apply: 'build',
    enforce: 'pre',
    resolveId(id, importer, options) {
        // 入口与无 importer 的顶层解析交给 Vite 处理
        if (options?.isEntry || !importer) return null;
        // 本地引用（相对路径、绝对路径、`@/` 别名、虚拟模块）交给 Vite 正常打包
        if (
            id.startsWith('.') ||
            id.startsWith('/') ||
            /^[a-zA-Z]:[\\/]/.test(id) ||
            id.startsWith('@/') ||
            id.startsWith('\0')
        ) {
            return null;
        }
        // bare specifier（第三方依赖、Node 内置模块、electron）=> 标记为 external
        return { id, external: true };
    },
});

// https://vitejs.dev/config/
export default defineConfig(() => {
    fs.rmSync('dist-electron', { recursive: true, force: true });
    const sourcemap = false;

    return {
        define: {
            'process.platform': JSON.stringify(process.platform),
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        plugins: [
            vue(),
            electron({
                main: {
                    // Shortcut of `build.lib.entry`
                    entry: {
                        index: 'src/main/bootstrap/index.ts',
                    },
                    onstart({ startup }) {
                        if (process.env.VSCODE_DEBUG) {
                            console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App');
                        } else {
                            startup();
                        }
                    },
                    vite: {
                        resolve: {
                            alias: {
                                '@': fileURLToPath(new URL('./src', import.meta.url)),
                            },
                        },
                        plugins: [externalizeNodeModulesPlugin(), visualizerPlugin('main')],
                        build: {
                            sourcemap,
                            minify: false,
                            outDir: 'dist-electron/main',
                            rollupOptions: {
                                // 所有 npm 依赖都不打进主进程产物，运行时直接通过 import 从 node_modules 解析。
                                // 因此这些依赖必须保留在 node_modules 中（dependencies 会被 electron-builder 打进 app.asar）。
                                external: [/node_modules/],
                            },
                        },
                    },
                },
                preload: {
                    // Shortcut of `build.rollupOptions.input`.
                    // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
                    input: 'src/main/preload/index.ts',
                    vite: {
                        build: {
                            sourcemap: sourcemap ? 'inline' : undefined, // #332
                            minify: false,
                            outDir: 'dist-electron/preload',
                            rollupOptions: {
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                            },
                        },
                    },
                },
                // Ployfill the Electron and Node.js API for Renderer process.
                // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
                // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
                renderer: {},
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
