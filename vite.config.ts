import fs from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron/simple';
import pkg from './package.json';
import { fileURLToPath, URL } from 'node:url';

// Set third-party env vars from package.json#config per npm docs recommendation
if (pkg.config) {
    process.env.ELECTRON_MIRROR ||= pkg.config.electron_mirror;
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||= pkg.config.electron_builder_binaries_mirror;
}

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
                        build: {
                            sourcemap,
                            minify: false,
                            outDir: 'dist-electron/main',
                            rollupOptions: {
                                // Some third-party Node.js libraries may not be built correctly by Vite, especially `C/C++` addons,
                                // we can use `external` to exclude them to ensure they work correctly.
                                // Others need to put them in `dependencies` to ensure they are collected into `app.asar` after the app is built.
                                // Of course, this is not absolute, just this way is relatively simple. :)
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
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
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        vue: ['vue'],
                        'element-plus': ['element-plus'],
                    },
                },
            },
        },
        clearScreen: false,
    };
});
