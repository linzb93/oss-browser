import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/**
 * Vitest 配置（与 electron.vite.config.ts 相互独立）。
 *
 * - 默认环境是 node（主进程 / 纯逻辑测试）
 * - 需要 DOM 的组件测试，在测试文件顶部加：`// @vitest-environment jsdom`
 *   （vitest 4 已移除 environmentMatchGlobs，改为按文件声明）
 * - 测试文件与被测代码放在一起，命名为 `*.test.ts` / `*.spec.ts`
 */
const ROOT = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(ROOT, 'src'),
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
});
