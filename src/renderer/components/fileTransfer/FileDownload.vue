<template>
<div>
  <h1>下载</h1>
  <el-table :data="list"></el-table>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const list = ref([]);
</script>
<style lang="scss" scoped>

</style>