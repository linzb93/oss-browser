<template>
    <div class="ask-delete-source">
        <p class="tips">是否删除源文件？</p>
        <el-checkbox :model-value="checked" @change="onChange">以后都自动删除源文件，不再询问</el-checkbox>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
    (e: 'change', checked: boolean): void;
}>();

/**
 * 是否以后都自动删除源文件，不再询问
 */
const checked = ref(false);

/**
 * 勾选状态变化时同步给父级
 * @param {boolean} value - 是否勾选
 */
const onChange = (value: boolean | string | number) => {
    checked.value = value === true;
    emit('change', checked.value);
};
</script>
<style lang="scss" scoped>
.ask-delete-source {
    .tips {
        margin-bottom: 10px;
    }
    :deep(.el-checkbox__label) {
        font-size: 13px;
        color: #666;
    }
}
</style>
