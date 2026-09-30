import path from 'node:path';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import eslintJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vuePlugin from 'eslint-plugin-vue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

/**
 * vue 的推荐规则（含强推荐 / 排版规则）。
 *
 * 这里把内层解析器换成 @typescript-eslint/parser，用来解析 <script lang="ts">；
 * 注意 .vue 不挂 `project`，避免模板文件因不在 tsconfig 的 program 里而报错。
 */
const vueConfigs = vuePlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    languageOptions: {
        ...(config.languageOptions || {}),
        parserOptions: {
            ...(config.languageOptions?.parserOptions || {}),
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
            extraFileExtensions: ['.vue'],
        },
    },
}));

/** TypeScript 推荐规则（带类型信息） */
const tsConfigs = tsPlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files: config.files || ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
        ...(config.languageOptions || {}),
        parser: tsParser,
        parserOptions: {
            ...(config.languageOptions?.parserOptions || {}),
            ecmaVersion: 'latest',
            sourceType: 'module',
            extraFileExtensions: ['.vue'],
            project: path.join(__dirname, 'tsconfig.json'),
            tsconfigRootDir: __dirname,
        },
    },
    rules: {
        ...(config.rules || {}),
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrors: 'none',
            },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
    },
}));

/**
 * .vue 的排版规则全部关闭。
 *
 * 现有组件的模板是「template 在前 + 4 空格缩进 + 单行多属性」的手写风格，
 * 开启这些规则会让 `eslint --fix` 大面积重排模板。这里只保留正确性规则。
 */
const vueFormattingRulesOff = {
    'vue/attributes-order': 'off',
    'vue/block-order': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/html-closing-bracket-spacing': 'off',
    'vue/html-indent': 'off',
    'vue/html-quotes': 'off',
    'vue/html-self-closing': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/mustache-interpolation-spacing': 'off',
    'vue/no-multi-spaces': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/v-on-event-hyphenation': 'off',
};

export default [
    {
        ignores: [
            'dist/**',
            'dist-electron/**',
            'release/**',
            'node_modules/**',
            'coverage/**',
            'public/**',
            'docs/**',
            'checklist/**',
            '.vscode/**',
            '.husky/**',
            'stats.*.html',
        ],
    },
    {
        name: 'eslint/base',
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        plugins: {
            import: importPlugin,
            promise: promisePlugin,
            '@stylistic': stylistic,
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.mjs', '.ts', '.d.ts', '.vue'],
                },
            },
        },
        rules: {
            ...eslintJs.configs.recommended.rules,
            ...importPlugin.configs.recommended.rules,
            ...promisePlugin.configs.recommended.rules,
            'import/named': 'off',
            'import/no-named-as-default-member': 'off',
            'import/no-unresolved': 'off',
            'promise/catch-or-return': 'off',
            'promise/always-return': 'off',
            'no-console': 'off',
            'no-debugger': isProduction ? 'error' : 'off',
            'no-async-promise-executor': 'off',
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-unused-vars': 'off',
            // 代码风格：与仓库现有代码保持一致（4 空格 + 分号）
            '@stylistic/indent': ['error', 4],
            '@stylistic/semi': ['error', 'always'],
            'no-unexpected-multiline': 'error',
        },
    },

    ...vueConfigs,
    {
        files: ['**/*.vue'],
        rules: {
            ...vueFormattingRulesOff,
            // 现有组件名不都是多单词（Preview.vue / Compare.vue / Progress.vue 等）
            'vue/multi-word-component-names': 'off',
            // 历史代码里的 props / emits 没有全部显式声明，不做强制
            'vue/require-default-prop': 'off',
            'vue/require-explicit-emits': 'off',
            'vue/no-template-shadow': 'off',
            // PicGo 同样的取舍：模板里允许 v-html 与驼峰属性
            'vue/no-v-html': 'off',
            'vue/attribute-hyphenation': 'off',
        },
    },

    ...tsConfigs,
    {
        files: ['**/*.{ts,vue}'],
        rules: {
            'no-undef': 'off',
        },
    },
    {
        files: ['**/*.d.ts'],
        rules: {
            'no-var': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },

    {
        // 渲染进程只能通过 preload 暴露的桥调用主进程能力
        files: ['src/renderer/**/*.{ts,vue}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: 'electron',
                            allowTypeImports: true,
                            message: '渲染进程请通过 src/helpers/request.ts 调用 IPC（preload 已暴露 window.ipcRenderer）。',
                        },
                        {
                            name: 'electron/renderer',
                            allowTypeImports: true,
                            message: '渲染进程请通过 src/helpers/request.ts 调用 IPC（preload 已暴露 window.ipcRenderer）。',
                        },
                    ],
                },
            ],
        },
    },

    {
        // 构建脚本 / 配置文件：Node 环境，ESM
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            sourceType: 'module',
        },
    },
];
