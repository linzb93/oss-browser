#!/usr/bin/env node
/**
 * 统一的 electron-vite 构建入口。
 *
 * electron-vite 的 CLI 没有“只构建主进程 / 只构建渲染进程”的参数，所以这里把
 * 构建目标通过环境变量传给 electron.vite.config.ts，由配置决定返回哪些构建项。
 *
 * 用 Node 脚本设置环境变量（而不是 `ELECTRON_VITE_BUILD_TARGET=ui electron-vite build`），
 * 是为了同时兼容 Windows 与 macOS 的 shell。
 *
 * 用法：node scripts/build.mjs <all|main|ui>
 *   all  = 主进程 + 预加载脚本 + 渲染进程
 *   main = 主进程 + 预加载脚本（产物在 dist-electron/）
 *   ui   = 渲染进程（产物在 dist/）
 */
import { build } from 'electron-vite';

const VALID_TARGETS = ['all', 'main', 'ui'];
const target = process.argv[2] ?? 'all';

if (!VALID_TARGETS.includes(target)) {
    console.error(`[build] 未知构建目标：${target}，可选值：${VALID_TARGETS.join(' / ')}`);
    process.exit(1);
}

process.env.ELECTRON_VITE_BUILD_TARGET = target;

try {
    // 按目标构建时配置里必然缺少另外两部分，关闭 electron-vite 的“config is missing”提示。
    await build({ ignoreConfigWarning: target !== 'all' });
} catch (error) {
    console.error(`[build] ${target} 构建失败`);
    console.error(error);
    process.exit(1);
}
