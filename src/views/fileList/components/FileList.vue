<template>
    <p>{{ tips }}</p>
    <ul>
        <li v-for="item in list" :key="item.name">
            <span class="name">{{ item.name }}</span>
            <el-link class="ml5" :underline="false" @click="openDialog(item.path || '', item.onlineUrl || '')"
                >查看对比</el-link
            >
        </li>
    </ul>
    <compare-dialog />
</template>

<script setup lang="ts">
import useCompare from '../hooks/useCompare';
import CompareDialog from '../components/Compare.vue';
const { openDialog } = useCompare();

const props = defineProps<{
    list: {
        name: string;
        path?: string;
        onlineUrl?: string;
        width?: number;
        height?: number;
    }[];
    tips: string;
}>();
</script>
<style lang="scss" scoped></style>
