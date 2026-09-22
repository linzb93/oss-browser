export default {
    extends: ["@commitlint/config-conventional"],
    rules: {
        // 关闭 subject 大小写限制
        "subject-case": [0],
    },
};
