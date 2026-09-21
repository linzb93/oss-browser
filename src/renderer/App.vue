<template>
    <div class="full-height">
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
                <div class="flexalign-center">
                    <div class="sidebar flexpack-end">
                        <el-tooltip content="设置">
                            <el-icon :size="34" @click="settingVisible = true">
                                <Setting />
                            </el-icon>
                        </el-tooltip>
                        <el-tooltip content="上传与下载">
                            <el-icon :size="34" @click="fileTransferVisible = true">
                                <sort />
                            </el-icon>
                        </el-tooltip>

                        <el-tooltip content="用户管理">
                            <el-icon :size="34" @click="manageVisible = true"><User /></el-icon>
                        </el-tooltip>
                    </div>
                    <div class="cont flexitem-1">
                        <breadcrumb />
                        <div class="flexalign-center">
                            <div class="flexitem-1">
                                <el-button type="primary" @click="createDirectory">创建目录</el-button>
                                <el-dropdown
                                    class="ml10"
                                    @command="(cmd: BatchCommandKey) => batchCommand(cmd, selected)"
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
                        </div>
                        <div class="other-wrap">
                            <el-table
                                :data="list"
                                v-loading="tableLoading"
                                height="calc(100vh - 140px)"
                                @selection-change="handleSelectionChange"
                            >
                                <el-table-column
                                    type="selection"
                                    :selectable="(row: ExtraTableItem) => row.type !== 'directory'"
                                    width="35"
                                />
                                <el-table-column label="名称">
                                    <template #default="scope">
                                        <div class="flexalign-center">
                                            <el-icon
                                                v-if="scope.row.type === 'directory'"
                                                :size="16"
                                                style="margin-right: 5px"
                                            >
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
                                        <el-link
                                            type="primary"
                                            underline="never"
                                            @click="requestActions.copy(scope.row.url)"
                                            >获取地址</el-link
                                        >
                                        <el-link
                                            type="primary"
                                            underline="never"
                                            v-if="scope.row.type !== 'directory'"
                                            @click="copyFile(scope.row)"
                                            >复制文件</el-link
                                        >
                                        <el-link
                                            type="primary"
                                            underline="never"
                                            class="mr10"
                                            @click="requestActions.download(scope.row.url)"
                                            >下载</el-link
                                        >
                                        <el-link
                                            type="primary"
                                            underline="never"
                                            class="mr10"
                                            style="margin-left: 0"
                                            v-if="isPic(scope.row) && !isNil(currentTemplate.id)"
                                            @click="getStyle(scope.row, currentAccount.domain)"
                                            >复制样式</el-link
                                        >
                                        <delete-confirm @confirm="deleteItem(scope.row)"></delete-confirm>
                                    </template>
                                </el-table-column>
                            </el-table>
                            <div class="pagination-wrap">
                                <ui-pagination
                                    :current-page="currentPage"
                                    :page-size="pageSize"
                                    :page-sizes="pageSizes"
                                    :has-prev="hasPrev"
                                    :has-next="hasNext"
                                    @prev="onPrev"
                                    @next="onNext"
                                    @update:page-size="setPageSize"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <upload-history v-model:visible="historyVisible" @select="getOSSList('reset')" />
            <progress-drawer v-model:visible="progressVisible" @refresh="getOSSList('reset')" />
            <collect-pane v-model:visible="collectVisible" />
            <setting-dialog v-model:visible="settingVisible" />
            <preview-dialog v-model:visible="previewVisible" />
        </template>
        <account-pane v-model:visible="manageVisible" @jump="handleSwitchAccount" @add="onAdd" />
        <add-account-dialog v-model:visible="addVisible" :detail="currentAccountForm" />
        <file-transfer-dialog v-model:visible="fileTransferVisible" />
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { isNil } from 'es-toolkit';
import { Folder, ArrowDown, Setting, Sort, User } from '@element-plus/icons-vue';
import AccountPane from '@/renderer/components/AccountPane.vue';
import AddAccountDialog from '@/renderer/components/AddAccountDialog.vue';
import Breadcrumb from '@/renderer/components/Breadcrumb.vue';
import FileTypeIcon from '@/renderer/components/FileTypeIcon.vue';
import UiPagination from '@/renderer/components/ui/Pagination.vue';
import { requestActions } from '@/renderer/utils/request';
import DeleteConfirm from '@/renderer/components/DeleteConfirm.vue';
import UploadHistory from '@/renderer/components/UploadHistory.vue';
import CollectPane from '@/renderer/components/CollectPane.vue';
import PreviewDialog from '@/renderer/components/Preview.vue';
import ProgressDrawer from '@/renderer/components/Progress.vue';
import { handleMainPost } from '@/renderer/utils';
import { getSize } from '@/renderer/utils/size';
import pathUtil from '@/renderer/utils/path';
import { isPic } from '@/renderer/utils/picture';
import { addCollect, setHome } from '@/renderer/api';
import { useSettingStore } from '@/renderer/hooks/common/useSetting';
import { useBreadcrumb } from '@/renderer/hooks/common/useBreadcrumb';
import {
    useOSSStore,
    batchCommand,
    deleteItem,
    createDirectory,
    getStyle,
    copyFile,
} from '@/renderer/hooks/service/useOSS';
import { useAccount } from '@/renderer/hooks/service/useAccount';
import { useUpload } from '@/renderer/hooks/service/useUpload';
import type { BatchCommandKey } from '@/renderer/hooks/service/useOSS';
import { usePreview } from '@/renderer/hooks/service/usePreview';
import { useTemplate } from '@/renderer/hooks/service/useTemplate';
import { ExtraTableItem, AccountItem } from '@/shared/types';
import FileTransferDialog from '@/renderer/components/fileTransfer/Dialog.vue';
import SettingDialog from '@/renderer/components/setting/Dialog.vue';

const { openPreview } = usePreview();
const { ossList, getOSSList, setPageSize, tableLoading, currentPage, pageSize, pageSizes, hasNext, hasPrev } =
    useOSSStore();
const { currentAccount, loadCurrentAccount, hasNoAccount } = useAccount();
const { breadcrumb, fullPath, pop: popBreadcrumb, push: pushBreadcrumb, setPath } = useBreadcrumb();
const { getSetting, setting } = useSettingStore();
const { currentTemplate, getCurrentTemplate } = useTemplate();
const { dragActive, setDragState, dropFile, progressVisible } = useUpload({
    afterUploadCallback: () => {}
});

const list = computed<ExtraTableItem[]>(() =>
    ossList.value.map((item) => ({
        name: item.name,
        type: item.type ?? '',
        size: item.size,
        lastModified: item.lastModified,
        path: item.path,
        url: `${currentAccount.value.domain}/${item.path}`,
    })),
);

/**
 * 保证粘贴后文件名拓展名与原文件一致，若被修改则恢复并提示
 * @param {string} originName - 原文件名
 * @param {string} newName - 用户输入的新文件名
 * @returns {string} 修正后的文件名
 */
const restoreExtension = (originName: string, newName: string) => {
    const dotIndex = originName.lastIndexOf('.');
    const ext = dotIndex > 0 ? originName.slice(dotIndex) : '';
    const newDotIndex = newName.lastIndexOf('.');
    const newExt = newDotIndex > 0 ? newName.slice(newDotIndex) : '';
    if (newExt.toLowerCase() !== ext.toLowerCase()) {
        ElMessage.warning(`拓展名不可修改，已自动恢复为「${ext || '无拓展名'}」`);
        return ext ? `${newName.slice(0, newDotIndex)}${ext}` : newName;
    }
    return newName;
};

const fileTransferVisible = ref(false);

onBeforeMount(async () => {
    await loadCurrentAccount();
    if (!hasNoAccount.value) {
        await getSetting();
        setPath(setting.value.homePath);
        await getOSSList('reset');
        await getCurrentTemplate();
        handleMainPost('back', () => {
            popBreadcrumb();
        });
        handleMainPost('create-directory', () => {
            createDirectory();
        });
        handleMainPost('reload', () => {
            getOSSList('reset');
        });
        handleMainPost('collect', async () => {
            await addCollect({ path: fullPath.value });
            ElMessage.success('保存成功');
        });
        handleMainPost('set-index', async () => {
            await setHome({ path: fullPath.value });
            ElMessage.success('设置成功');
        });
        handleMainPost('paste-rename', async ({ name }: { name: string }) => {
            try {
                const { value } = await ElMessageBox.prompt('请确认文件名称', '粘贴文件', {
                    inputValue: name,
                    confirmButtonText: '粘贴',
                    cancelButtonText: '取消',
                });
                if (!value) {
                    return null;
                }
                return restoreExtension(name, value);
            } catch (error) {
                return null;
            }
        });
        handleMainPost('paste-confirm', async ({ name }: { name: string }) => {
            try {
                await ElMessageBox.confirm(`当前目录已存在「${name}」，是否覆盖？`, '温馨提示', {
                    confirmButtonText: '覆盖',
                    cancelButtonText: '取消',
                    type: 'warning',
                });
                return true;
            } catch (error) {
                return false;
            }
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

const selected = ref<ExtraTableItem[]>([]);
/**
 * 多选项发生改变时触发的方法。目前不操作目录
 * @param {ExtraTableItem[]} selection - 已选中项
 */
const handleSelectionChange = (selection: ExtraTableItem[]) => {
    selected.value = selection.filter((item) => item.type !== 'directory');
};
const clickPath = (item: ExtraTableItem) => {
    if (item.size > 0) {
        // 是图片
        if (isPic(item)) {
            openPreview(item.url);
            return;
        }
        return;
    }
    pushBreadcrumb(item.name);
    getOSSList('reset');
};

const activeIndex = ref(-1);

/**
 * el-pagination 的「上一页」点击处理
 */
const onPrev = () => {
    if (!hasPrev.value) {
        return;
    }
    getOSSList('prev');
};
/**
 * el-pagination 的「下一页」点击处理
 */
const onNext = () => {
    if (!hasNext.value) {
        return;
    }
    getOSSList('next');
};

/**
 * 重置选中项索引
 */
const resetActiveIndex = () => {
    activeIndex.value = -1;
};

const currentAccountForm = ref<AccountItem>({} as AccountItem);
const onAdd = (row: AccountItem) => {
    currentAccountForm.value = row;
    addVisible.value = true;
};

const handleSwitchAccount = () => {
    getOSSList('reset');
    getCurrentTemplate();
};
</script>
<style lang="scss" scoped>
@use '@/renderer/styles/mixin.scss' as *;
.sidebar {
    height: 100vh;
    width: 60px;
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    padding: 30px 0;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    .el-icon {
        margin: 20px auto 0;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        &:hover {
            background: #e1e1e1;
        }
        &:first-child {
            margin-top: 0;
        }
    }
}
.cont {
    padding: 10px 10px 0;
    display: flex;
    flex-direction: column;
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
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
}
.pagination-wrap {
    padding: 10px 0;
    display: flex;
    justify-content: flex-end;
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
