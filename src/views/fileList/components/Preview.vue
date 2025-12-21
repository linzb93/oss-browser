<template>
    <el-dialog v-model="imgPreview.visible" :title="dialogTitle" :width="`${imgPreview.width}px`" top="2%">
        <template v-if="type === 'img'">
            <p class="size">图片尺寸：{{ imgPreview.realWidth }} * {{ imgPreview.realHeight }}</p>
            <div class="center" :style="{ backgroundColor: imgPreview.bgColor }">
                <img :src="imgPreview.url" class="img-dialog-preview" />
            </div>
        </template>
        <template v-else-if="type === 'text'">
            <div class="text-dialog-preview">
                {{ textPreview.content }}
            </div>
        </template>
        <template #footer>
            <div class="flexalign-center flexpack-end">
                <el-button @click="changeBgColor">背景色替换</el-button>
                <el-button type="primary" @click="requestUtil.open('web', imgPreview.url)">在浏览器打开</el-button>
                <el-dropdown class="ml10">
                    <span class="curp">
                        更多功能
                        <el-icon class="ml5">
                            <arrow-down />
                        </el-icon>
                    </span>
                    <template #dropdown>
                        <el-dropdown-item action="forceRefresh">强制刷新</el-dropdown-item>
                    </template>
                </el-dropdown>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import usePreview from '../hooks/usePreview';
import { requestUtil } from '@/helpers/request';
import { ArrowDown } from '@element-plus/icons-vue';
const { imgPreview, textPreview, changeBgColor } = usePreview();

const props = defineProps({
    type: {
        type: String,
        default: 'img',
    },
});

const dialogTitle = computed(() => {
    if (props.type === 'img') {
        return '图片预览';
    }
    if (props.type === 'text') {
        return '文本预览';
    }
    return '';
});
</script>
<style lang="scss" scoped>
.center {
    text-align: center;
}
.img-dialog-preview {
    max-width: 100%;
}
.table-preview-img {
    max-width: 100px;
}
.file-content {
    max-height: 50vh;
    overflow: auto;
    word-break: break-all;
}
</style>
