<template>
    <div class="cont">
        <el-empty v-if="hasNoAccount">
            <template #description>
                <el-button type="primary" @click="addVisible = true">添加您的第一个账号</el-button>
            </template>
        </el-empty>
        <template v-else>
            <breadcrumb />
            <oss-table />
        </template>
        <account-pane v-model:visible="manageVisible" />
        <add-account-dialog v-model:visible="addVisible" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from 'vue';
import AccountPane from '@/renderer/components/AccountPane.vue';
import AddAccountDialog from '@/renderer/components/AddAccountDialog.vue';
import Breadcrumb from '@/renderer/components/Breadcrumb.vue';
import OssTable from '@/renderer/components/OSSTable.vue';
import { useGlobalConfigStore } from '@/renderer/store/useGlobalConfig';

const { loadCurrentAccount, hasNoAccount } = useGlobalConfigStore();
onBeforeMount(async () => {
    await loadCurrentAccount();
});
const manageVisible = ref(false);
const addVisible = ref(false);
</script>
<style lang="scss" scoped>
.cont {
    padding: 10px 10px 0;
}
</style>
<style>
#app {
    height: 100%;
}
</style>
