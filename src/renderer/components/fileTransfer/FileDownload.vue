<template>
    <div>
        <div v-if="downloadSummary.total" class="ctrl-bar flexalign-center">
            <el-progress
                class="flexitem-1"
                :percentage="downloadSummary.percent"
                :stroke-width="12"
                :text-inside="true"
            />
            <span class="ml10 ws-nowrap">
                已完成 {{ downloadSummary.finished }}/{{ downloadSummary.total }}
            </span>
            <el-text v-if="downloadSummary.failed" type="danger" class="ml10">
                失败 {{ downloadSummary.failed }}
            </el-text>
            <el-button
                class="ml10"
                type="primary"
                :disabled="!downloadSavedPath"
                @click="requestActions.open('path', downloadSavedPath)"
                >打开文件夹</el-button
            >
        </div>
        <el-empty v-if="!downloadingList.length" description="暂无下载任务" />
        <template v-else>
            <el-table :data="downloadingList" height="320">
                <el-table-column label="状态" width="70">
                    <template #default="scope">
                        <el-progress
                            v-if="!scope.row.finished"
                            type="circle"
                            :percentage="Math.round(scope.row.progress)"
                            :width="16"
                            :stroke-width="2"
                            :show-text="false"
                        />
                        <el-tooltip v-else-if="scope.row.failed" content="下载失败">
                            <el-icon color="#F56C6C" :size="16"><warning-filled /></el-icon>
                        </el-tooltip>
                        <el-icon v-else color="#67C23A" :size="16"><check /></el-icon>
                    </template>
                </el-table-column>
                <el-table-column label="名称" show-overflow-tooltip>
                    <template #default="scope">{{ pathUtil.basename(scope.row.path) }}</template>
                </el-table-column>
                <el-table-column label="本地路径" show-overflow-tooltip>
                    <template #default="scope">{{ scope.row.path }}</template>
                </el-table-column>
                <el-table-column label="大小" width="100">
                    <template #default="scope">{{ scope.row.size ? getSize(scope.row) : '-' }}</template>
                </el-table-column>
                <el-table-column label="进度" width="70">
                    <template #default="scope">{{ Math.round(scope.row.progress) }}%</template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                    <template #default="scope">
                        <el-link
                            type="primary"
                            underline="never"
                            @click="requestActions.copy(`${currentAccount.domain}/${scope.row.key}`)"
                            >复制地址</el-link
                        >
                    </template>
                </el-table-column>
            </el-table>
            <div v-if="downloadSummary.truncated" class="tips">文件较多，仅展示前 200 条</div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { Check, WarningFilled } from '@element-plus/icons-vue';
import { requestActions } from '@/renderer/utils/request';
import pathUtil from '@/renderer/utils/path';
import { getSize } from '@/renderer/utils/size';
import { useAccount } from '@/renderer/hooks/service/useAccount';
import { useDownload } from '@/renderer/hooks/service/useDownload';

const { currentAccount } = useAccount();
const { downloadingList, downloadSavedPath, downloadSummary } = useDownload();
</script>
<style lang="scss" scoped>
.ws-nowrap {
    white-space: nowrap;
}
.tips {
    padding-top: 8px;
    color: #909399;
    font-size: 12px;
}
</style>
