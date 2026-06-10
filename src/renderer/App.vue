<template>
    <div class="cont full-height">
        <el-empty v-if="hasNoAccount">
            <template #description>
                <el-button type="primary" @click="addVisible = true">添加您的第一个账号</el-button>
            </template>
        </el-empty>
        <template v-else>
            <div
                class="wrap"
                :class="{ active: dragActive }"
                @dragover.prevent="setDragState(true)"
                @drop.prevent="(e) => dropFile(e, ossList, currentAccount.domain)"
                @dragleave.prevent="setDragState(false)"
            >
                <div class="layer flex-center" @keyup="setDragState(false)">
                    <p class="tips">请将需要上传的文件拖拽至此</p>
                </div>
                <breadcrumb />
                <div class="flexalign-center">
                    <div class="flexitem-1">
                        <el-button type="primary" @click="createDirectory">创建目录</el-button>
                        <el-dropdown
                            class="ml10"
                            @command="(cmd: BatchCommandKey) => batchCommand(cmd, selected, currentAccount.domain)"
                            v-if="selected.length"
                        >
                            <el-button type="primary">
                                <span>批量操作</span>
                                <el-icon :size="14" class="dropdown-icon"><arrow-down /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="copy">批量复制地址</el-dropdown-item>
                                    <el-dropdown-item command="download">批量下载</el-dropdown-item>
                                    <el-dropdown-item command="delete"
                                        ><el-text type="danger">批量删除</el-text></el-dropdown-item
                                    >
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                    <el-dropdown @command="moreCommand">
                        <el-button type="primary">
                            <span>更多功能</span>
                            <el-icon :size="14" class="dropdown-icon"><arrow-down /></el-icon>
                        </el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="setting">设置</el-dropdown-item>
                                <el-dropdown-item command="see-collect">查看收藏夹</el-dropdown-item>
                                <el-dropdown-item command="collect">收藏</el-dropdown-item>
                                <el-dropdown-item command="home-page">设为首页</el-dropdown-item>
                                <el-dropdown-item command="upload-history">上传历史</el-dropdown-item>
                                <el-dropdown-item command="manage-account">管理账号</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
                <div
                    class="other-wrap"
                    :infinite-scroll-immediate="false"
                    :infinite-scroll-disabled="disabled"
                    :infinite-scroll-distance="200"
                    v-infinite-scroll="() => getOSSList(true)"
                >
                    <el-table :data="ossList" v-loading="tableLoading" @selection-change="handleSelectionChange">
                        <el-table-column
                            type="selection"
                            :selectable="(row: TableItem) => row.type !== 'directory'"
                            width="35"
                        />
                        <el-table-column label="名称">
                            <template #default="scope">
                                <div class="flexalign-center">
                                    <el-icon v-if="scope.row.type === 'directory'" :size="16" style="margin-right: 5px">
                                        <folder />
                                    </el-icon>
                                    <file-type-icon :type="pathUtil.extname(scope.row.name)" v-else />
                                    <span
                                        class="file-name"
                                        :class="{ active: activeIndex === scope.$index }"
                                        @click="clickPath(scope.row)"
                                        >{{ scope.row.name }}</span
                                    >
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="大小">
                            <template #default="scope">
                                <template v-if="scope.row.type === 'directory'">-</template>
                                <template v-else>{{ getSize(scope.row) }}</template>
                            </template>
                        </el-table-column>
                        <el-table-column label="最后修改时间">
                            <template #default="scope">
                                {{
                                    scope.row.type === 'directory'
                                        ? '-'
                                        : dayjs(scope.row.lastModified).format('YYYY-MM-DD HH:mm:ss')
                                }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作">
                            <template #default="scope">
                                <el-link type="primary" :underline="false" @click="requestActions.copy(scope.row.url)"
                                    >获取地址</el-link
                                >
                                <el-link
                                    type="primary"
                                    :underline="false"
                                    class="mr10"
                                    @click="requestActions.download(scope.row.url)"
                                    >下载</el-link
                                >
                                <el-link
                                    type="primary"
                                    :underline="false"
                                    class="mr10"
                                    style="margin-left: 0"
                                    v-if="isPic(scope.row) && currentTemplate.id"
                                    @click="getStyle(scope.row, currentAccount.domain)"
                                    >复制样式</el-link
                                >
                                <delete-confirm @confirm="deleteItem(scope.row)"></delete-confirm>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
            <upload-history v-model:visible="historyVisible" @select="getOSSList(false)" />
            <progress-drawer v-model:visible="progressVisible" @refresh="getOSSList(false)" />
            <collect-pane v-model:visible="collectVisible" />
            <setting-dialog v-model:visible="settingVisible" />
            <preview-dialog v-model:visible="previewVisible" />
        </template>
        <account-pane v-model:visible="manageVisible" @jump="getOSSList(false)" @add="addVisible = true" />
        <add-account-dialog v-model:visible="addVisible" />
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { ElMessage } from 'element-plus';
import { Folder, ArrowDown } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import AccountPane from '@/renderer/components/AccountPane.vue';
import AddAccountDialog from '@/renderer/components/AddAccountDialog.vue';
import { requestActions } from '@/renderer/utils/request';
import { getSize } from '@/renderer/utils/size';
import Breadcrumb from '@/renderer/components/Breadcrumb.vue';
import FileTypeIcon from '@/renderer/components/FileTypeIcon.vue';
import DeleteConfirm from '@/renderer/components/DeleteConfirm.vue';
import UploadHistory from '@/renderer/components/UploadHistory.vue';
import CollectPane from '@/renderer/components/CollectPane.vue';
import { addCollect, setHome } from '@/renderer/api';
import { useGlobalConfigStore } from '@/renderer/hooks/common/useGlobalConfig';
import { handleMainPost } from '@/renderer/utils';
import { useOSSStore, batchCommand, deleteItem, createDirectory, getStyle } from '@/renderer/hooks/service/useOSS';
import { useAccount } from '@/renderer/hooks/service/useAccount';
import { useUpload } from '@/renderer/hooks/service/useUpload';
import pathUtil from '@/renderer/utils/path';
import { isPic } from '@/renderer/utils/picture';
import ProgressDrawer from '@/renderer/components/Progress.vue';
import type { BatchCommandKey } from '@/renderer/hooks/service/useOSS';
import PreviewDialog from '@/renderer/components/Preview.vue';
import SettingDialog from '@/renderer/components/Setting.vue';
import { useBreadcrumb } from '@/renderer/hooks/common/useBreadcrumb';
import { TableItem } from '@/shared/types';
import { usePreview } from '@/renderer/hooks/service/usePreview';
import { useTemplate } from '@/renderer/hooks/service/useTemplate';

const { openPreview } = usePreview();
const { ossList, getOSSList, disabled, tableLoading } = useOSSStore();
const { currentAccount, loadCurrentAccount, hasNoAccount } = useAccount();
const { breadcrumb, fullPath, pop: popBreadcrumb, push: pushBreadcrumb, setPath } = useBreadcrumb();
const { getSetting, setting } = useGlobalConfigStore();
const { currentTemplate, getCurrentTemplate } = useTemplate();
const { dragActive, setDragState, dropFile, progressVisible } = useUpload();

onBeforeMount(async () => {
    await loadCurrentAccount();
    if (!hasNoAccount.value) {
        await getSetting();
        setPath(setting.value.homePath);
        await getOSSList(false);
        await getCurrentTemplate();
        handleMainPost('back', () => {
            popBreadcrumb();
        });
        handleMainPost('create-directory', () => {
            createDirectory();
        });
        handleMainPost('reload', () => {
            getOSSList();
        });
        handleMainPost('location', (data: { isDown: boolean }) => {
            const { isDown } = data;
            if (isDown) {
                if (activeIndex.value < ossList.value.length - 1) {
                    activeIndex.value += 1;
                }
            } else {
                if (activeIndex.value > 0) {
                    activeIndex.value -= 1;
                } else {
                    activeIndex.value = 0;
                }
            }
            if (activeIndex.value > 5) {
                const rowHeight = (document.querySelector('.el-table__row') as HTMLElement).clientHeight;
                (document.querySelector('.other-wrap') as HTMLElement).scrollTop =
                    (activeIndex.value - 4) * rowHeight - 2;
            }
        });
    }
});
const manageVisible = ref(false);
const addVisible = ref(false);
const historyVisible = ref(false);
const collectVisible = ref(false);
const settingVisible = ref(false);
const previewVisible = ref(false);

const selected = ref<TableItem[]>([]);
/**
 * 多选项发生改变时触发的方法。目前不操作目录
 * @param {TableItem[]} selection - 已选中项
 */
const handleSelectionChange = (selection: TableItem[]) => {
    selected.value = selection.filter((item) => item.type !== 'directory');
};
const getFileFullUrl = (item: TableItem) => `${currentAccount.value.domain}/${item.path}`;
const clickPath = (item: TableItem) => {
    if (item.size > 0) {
        // 是图片
        if (isPic(item)) {
            openPreview(getFileFullUrl(item));
            return;
        }
        return;
    }
    pushBreadcrumb(item.name);
    getOSSList(false);
};

const activeIndex = ref(-1);

/**
 * 重置选中项索引
 */
const resetActiveIndex = () => {
    activeIndex.value = -1;
};
/**
 * 处理更多命令
 * @param {'setting' | 'see-collect' | 'collect' | 'home-page' | 'upload-history' | 'manage-account'} cmd - 命令名称
 */
const moreCommand = async (
    cmd: 'setting' | 'see-collect' | 'collect' | 'home-page' | 'upload-history' | 'manage-account',
) => {
    const actions = {
        'setting': () => (settingVisible.value = true),
        'see-collect': () => (collectVisible.value = true),
        'collect': async () => {
            await addCollect({ path: fullPath.value });
            ElMessage.success('保存成功');
        },
        'home-page': async () => {
            await setHome({ path: fullPath.value });
            ElMessage.success('设置成功');
        },
        'upload-history': () => (historyVisible.value = true),
        'manage-account': () => (manageVisible.value = true),
    };
    if (typeof actions[cmd] === 'function') {
        actions[cmd]();
    } else {
        ElMessage.error('没有这个命令');
    }
};
</script>
<style lang="scss" scoped>
@use '@/renderer/styles/mixin.scss' as *;
.cont {
    padding: 10px 10px 0;
}
.el-link + .el-link {
    margin-left: 10px;
}
.file-name {
    cursor: pointer;
    &:hover,
    &.active {
        color: #409eff;
    }
}
.other-wrap {
    position: absolute;
    top: 65px;
    bottom: 0;
    left: 0;
    right: -10px;
    overflow: auto;
}
.dropdown-icon {
    margin-left: 5px;
    color: #fff;
}
.wrap {
    min-height: 100%;
    position: relative;
    &.active {
        .layer {
            display: flex;
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            right: 0;
            z-index: 4;
            background: rgba(255, 255, 100, 0.7);
        }
        .tips {
            display: block;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
        }
    }
    .layer {
        display: none;
        pointer-events: none;
    }
    .tips {
        display: none;
    }
}
</style>
<style>
#app {
    height: 100%;
}
</style>
