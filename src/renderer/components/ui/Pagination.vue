<template>
    <div class="ui-pagination">
        <button
            type="button"
            class="ui-pagination__btn"
            :disabled="!hasPrev"
            @click="emit('prev')"
        >
            上一页
        </button>
        <span class="ui-pagination__current">第 {{ currentPage }} 页</span>
        <button
            type="button"
            class="ui-pagination__btn"
            :disabled="!hasNext"
            @click="emit('next')"
        >
            下一页
        </button>
        <el-select
            class="ui-pagination__sizes"
            :model-value="pageSize"
            :disabled="disabled"
            @change="onSizeChange"
        >
            <el-option
                v-for="size in pageSizes"
                :key="size"
                :label="`${size} 条/页`"
                :value="size"
            />
        </el-select>
    </div>
</template>

<script setup lang="ts">
/**
 * 极简分页组件：
 * - 上一页 / 当前页 / 下一页（仅展示当前页码，不提供跳转入口）
 * - 每页条数切换
 */
interface Props {
    /**
     * 当前页码（从 1 开始）
     */
    currentPage: number;
    /**
     * 每页条数
     */
    pageSize: number;
    /**
     * 每页条数可选档位
     */
    pageSizes: number[];
    /**
     * 是否存在上一页
     */
    hasPrev: boolean;
    /**
     * 是否存在下一页
     */
    hasNext: boolean;
    /**
     * 是否整体禁用（loading 时使用）
     */
    disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
    disabled: false,
});
const emit = defineEmits<{
    (e: 'prev'): void;
    (e: 'next'): void;
    (e: 'update:pageSize', size: number): void;
}>();
const onSizeChange = (size: number) => {
    if (size === props.pageSize) {
        return;
    }
    emit('update:pageSize', size);
};
</script>

<style lang="scss" scoped>
.ui-pagination {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #606266;
}
.ui-pagination__btn {
    border: 1px solid #dcdfe6;
    background: #fff;
    color: #606266;
    border-radius: 4px;
    padding: 5px 14px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background-color 0.2s;
    &:hover:not(:disabled) {
        color: #409eff;
        border-color: #409eff;
    }
    &:disabled {
        color: #c0c4cc;
        cursor: not-allowed;
        background-color: #f5f7fa;
    }
}
.ui-pagination__current {
    padding: 0 8px;
    user-select: none;
}
.ui-pagination__sizes {
    width: 110px;
}
</style>
