<template>
    <el-dialog
        title="图片覆盖对比"
        v-model="visible"
        :width="dialogWidth"
        :body-style="{ padding: '16px' }"
        append-to-body
    >
        <div class="vs-content" :style="{ height: dialogBodyHeight }">
            <div class="vs-pane">
                <h3>线上的</h3>
                <p class="size">尺寸：{{ currentImage.width }}px * {{ currentImage.height }}px</p>
                <div class="img">
                    <img v-if="currentImage.url" class="img-inner" :src="buildImageSrc(currentImage.url)" alt="" />
                </div>
            </div>
            <div class="vs-pane">
                <h3>本地的</h3>
                <p class="size">尺寸：{{ compareImage.width }}px * {{ compareImage.height }}px</p>
                <div class="img">
                    <img v-if="compareImage.url" class="img-inner" :src="buildImageSrc(compareImage.url)" alt="" />
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import useCompare from '../hooks/useCompare';
const { visible, currentImage, compareImage, dialogWidth, dialogBodyHeight } = useCompare();

/**
 * Build image src for url, encoding special characters when needed.
 */
const buildImageSrc = (url: string) => {
    if (!url) return '';
    return encodeURI(url);
};
</script>
<style lang="scss" scoped>
.vs-content {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: stretch;
}
.vs-pane {
    width: 49%;
    height: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
}
.vs-pane h3 {
    margin: 0 0 8px 0;
}
.vs-pane .size {
    margin: 0 0 8px 0;
}
.img {
    flex: 1;
    min-height: 0;
    width: 100%;
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.img-inner {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
}
</style>
