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

<script setup>
import { ref, onMounted } from 'vue';
import AccountPane from '@/renderer/components/AccountPane.vue';
import AddAccountDialog from '@/renderer/components/AddAccountDialog.vue';
import Breadcrumb from '@/renderer/components/Breadcrumb.vue';
import OssTable from '@/renderer/components/OSSTable.vue';

import { useAccount } from '@/renderer/hooks/useAccount-v2';

const { hasNoAccount, boostrap } = useAccount();
boostrap();
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
