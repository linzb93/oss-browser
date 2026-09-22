import fs from 'node:fs';
import { defineConfig } from 'vite';
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
    const isBuild = command === 'build';
    const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

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
            electronSimple({
                main: {
                    // Shortcut of `options.build.rolldownOptions.input`
                    // (`options.build.rollupOptions.input` on Vite < 8)
                    input: {
                        index: 'src/main/bootstrap/index.ts',
                    },
                    onstart({ startup }) {
                        if (process.env.VSCODE_DEBUG) {
                            console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App');
                        } else {
                            startup();
                        }
                    },
                    plugins: [notBundle()],
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
                    input: 'src/main/preload/index.ts',
                    plugins: [notBundle()],
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