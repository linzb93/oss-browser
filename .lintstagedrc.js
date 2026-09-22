// .lintstagedrc.js
export default {
    // 针对 Vue 和 JS/TS 文件，先 oxlint 修复，再 oxfmt 格式化
    "*.{vue,js,ts,jsx,tsx}": [
        "oxlint --fix", // 自动修复可修复的 lint 问题
        "oxfmt --write --no-error-on-unmatched-pattern", // 格式化文件
    ],
    // 其他文件（如 JSON、CSS）只用 oxfmt 格式化
    // --no-error-on-unmatched-pattern：匹配到的文件被 .prettierignore 忽略时跳过，而不是报错退出
    "*.{json,css,scss,md}": "oxfmt --write --no-error-on-unmatched-pattern",
};
