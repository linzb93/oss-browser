<template>
    <div class="path mb10 flexalign-center">
        <template v-if="breadcrumb.length">
            <el-icon :size="16" class="mr10 curp" @click="popBreadcrumb()"><back /></el-icon>
            <el-icon @click="setBreadcrumb(-1)" class="curp" :size="16">
                <home-filled />
            </el-icon>
            <el-icon class="mr10" :size="16">
                <arrow-right />
            </el-icon>
        </template>
        <div
            class="path-item flexalign-center curp"
            v-for="(item, index) in breadcrumb"
            :key="item"
            @click="setBreadcrumb(index)"
        >
            <el-icon :size="16">
                <folder />
            </el-icon>
            <span class="path-name">{{ item }}</span>
            <el-icon v-if="index < breadcrumb.length - 1">
                <arrow-right />
            </el-icon>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Folder, ArrowRight, HomeFilled, Back } from '@element-plus/icons-vue';
import { useBreadcrumb } from '@/renderer/hooks/common/useBreadcrumb';
const { breadcrumb, set: setBreadcrumb, pop: popBreadcrumb } = useBreadcrumb();
</script>
<style lang="scss" scoped></style>
