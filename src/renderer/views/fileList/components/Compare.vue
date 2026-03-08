<template>
    <el-dialog title="图片覆盖对比" v-model="visible" width="80%" append-to-body>
        <div class="vs-content flexalign-start">
            <div class="vs-pane">
                <h3>线上的</h3>
                <p class="size">尺寸：{{ currentImage.width }}px * {{ currentImage.height }}px</p>
                <div class="img" :style="{ backgroundImage: `url(${currentImage.url})` }"></div>
            </div>
            <div class="vs-pane">
                <h3>本地的</h3>
                <p class="size">尺寸：{{ compareImage.width }}px * {{ compareImage.height }}px</p>
                <div class="img" :style="{ backgroundImage: `url(${compareImage.url})` }"></div>
            </div>
            <div class="ico-vs">VS</div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import useCompare from '../hooks/useCompare';
const { visible, currentImage, compareImage } = useCompare();
</script>
<style lang="scss" scoped>
.ico-vs {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    color: #333;
    width: 30px;
    height: 30px;
    background: yellow;
    border-radius: 50%;
    line-height: 30px;
    text-align: center;
    border: 1px solid yellowGreen;
}
.vs-content {
    position: relative;
}
.vs-pane {
    &:first-child {
        margin-right: 10px;
    }
}
.img {
    width: 300px;
    height: 300px;
    border: 1px solid #333;
    // background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}
</style>
