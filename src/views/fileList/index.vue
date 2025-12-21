<template>
    <div
        class="wrap"
        :class="{ active: active }"
        @dragover.prevent="setDragState(true)"
        @drop.prevent="dropFile"
        @dragleave.prevent="setDragState(false)"
    >
        <div class="layer flex-center" @keyup="setDragState(false)">
            <p class="tips">请将需要上传的文件拖拽至此</p>
        </div>
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
        <div class="flexalign-center">
            <div class="flexitem-1">
                <el-button type="primary" @click="createDir">创建目录</el-button>
                <el-dropdown class="ml10" @command="batchCommand" v-if="selected.length">
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
                        <el-dropdown-item command="back-login">返回登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
        <div
            class="other-wrap"
            :infinite-scroll-immediate="false"
            :infinite-scroll-disabled="disabled"
            :infinite-scroll-distance="200"
            v-infinite-scroll="() => getList(true)"
        >
            <el-table :data="tableList" @selection-change="handleSelectionChange">
                <el-table-column type="selection" :selectable="(row: TableItem) => row.type !== 'dir'" width="35" />
                <el-table-column label="名称">
                    <template #default="scope">
                        <div class="flexalign-center">
                            <el-icon v-if="scope.row.type === 'dir'" :size="16" style="margin-right: 5px">
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
                <el-table-column label="预览图" v-if="setting.previewType === 2">
                    <template #default="scope">
                        <img class="table-preview-img curp" :src="scope.row.url" @click="clickPath(scope.row)" />
                    </template>
                </el-table-column>
                <el-table-column label="大小">
                    <template #default="scope">
                        <template v-if="scope.row.type === 'dir'">-</template>
                        <template v-else>{{ getSize(scope.row) }}</template>
                    </template>
                </el-table-column>
                <el-table-column label="最后修改时间">
                    <template #default="scope">
                        {{
                            scope.row.type === 'dir' ? '-' : dayjs(scope.row.lastModified).format('YYYY-MM-DD HH:mm:ss')
                        }}
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #default="scope">
                        <el-link type="primary" :underline="false" @click="requestUtil.copy(scope.row.url)"
                            >获取地址</el-link
                        >
                        <el-link type="primary" :underline="false" class="mr10" @click="downloadItem(scope.row)"
                            >下载</el-link
                        >
                        <el-link
                            type="primary"
                            :underline="false"
                            class="mr10"
                            style="margin-left: 0"
                            v-if="isPic(scope.row) && hasTemplate"
                            @click="getStyle(scope.row)"
                            >复制样式</el-link
                        >
                        <delete-confirm @confirm="doDelete(scope.row)"></delete-confirm>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
    <upload-history :domain="userInfo.domain" @select="onSelectHistory" />
    <progress-drawer
        v-model:visible="progressVisible"
        :upload-list="uploadingList"
        :path="fullPath"
        @refresh="getList(false)"
    />
    <collect-pane />
    <setting-dialog />
    <el-dialog v-model="imgPreview.visible" title="图片预览" :width="`${imgPreview.width}px`" top="2%">
        <div class="center" :style="{ backgroundColor: previewBgColor }">
            <img :src="imgPreview.url" class="img-dialog-preview" />
        </div>
        <template #footer>
            <div class="flexalign-center flexpack-end">
                <el-button @click="changeBgColor">背景色替换</el-button>
                <el-button type="primary" @click="requestUtil.open('web', imgPreview.url)">在浏览器打开</el-button>
                <el-dropdown class="ml10">
                    <span class="curp">
                        更多功能
                        <el-icon class="ml5">
                            <arrow-down />
                        </el-icon>
                    </span>
                    <template #dropdown>
                        <el-dropdown-item action="forceRefresh">强制刷新</el-dropdown-item>
                    </template>
                </el-dropdown>
            </div>
        </template>
    </el-dialog>
    <el-dialog v-model="textPreview.visible" title="文件预览" width="800px">
        <div class="file-content">{{ textPreview.content }}</div>
    </el-dialog>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import useLogin from '@/views/home/hooks/useLogin';
import { Folder, ArrowRight, HomeFilled, ArrowDown, Back } from '@element-plus/icons-vue';
import { getSize } from '@/helpers/size';
import useUpload from './hooks/useUpload';
import useBreadcrumb from './hooks/useBreadcrumb';
import pathUtil from '@/helpers/path';
import useHistory from './hooks/useHistory';
import UploadHistory from './components/UploadHistory.vue';
import { requestUtil } from '@/helpers/request';
import FileTypeIcon from '@/components/FileTypeIcon.vue';
import DeleteConfirm from '@/components/DeleteConfirm.vue';
import ProgressDrawer from './components/Progress.vue';
import SettingDialog from './components/Setting.vue';
import useSetting from './hooks/useSetting';
import CollectPane from './components/CollectPane.vue';
import useCollect from './hooks/useCollect';
import useTable from './hooks/useTable';
import useTemplate from './hooks/useTemplate';
import useTableItem from './hooks/useTableItem';
import { type TableItem } from './shared/types';
import request from '@/helpers/request';
const route = useRoute();
const router = useRouter();
const {
    init: tableInit,
    tableList,
    disabled,
    getList,
    selected,
    doDelete,
    createDir,
    handleSelectionChange,
    batchCopy,
    batchDelete,
    batchDownload,
    activeIndex,
    resetActiveIndex,
} = useTable();
const {
    breadcrumb,
    fullPath,
    pop: popBreadcrumb,
    set: setBreadcrumb,
    init: initBreadcrumb,
    onChange: onBreadcrumbChange,
} = useBreadcrumb();

const {
    init: tableItemInit,
    imgPreview,
    textPreview,
    previewBgColor,
    clickPath,
    getStyle,
    isPic,
    download: downloadItem,
    changeBgColor,
} = useTableItem();

const { userInfo, getUserInfo } = useLogin();

const { setting, getSetting, setHome, show: showSettingDialog } = useSetting();
const { add: addCollect, show: showCollectDialog } = useCollect();
const { hasTemplate } = useTemplate();
onMounted(() => {
    getUserInfo(route.query.id as string);
    tableInit();
    tableItemInit();
    onBreadcrumbChange(() => {
        resetActiveIndex();
        getList(false);
    });
    getSetting().then(() => {
        initBreadcrumb(setting.value.homePath);
    });
});
// 批量操作
const batchCommand = (command: 'download' | 'delete' | 'copy') => {
    const actions = {
        download: batchDownload,
        delete: batchDelete,
        copy: batchCopy,
    };
    if (actions[command]) {
        actions[command]();
    }
};

// 更多功能
const moreCommand = async (
    cmd: 'setting' | 'see-collect' | 'collect' | 'home-page' | 'upload-history' | 'back-login'
) => {
    const actions = {
        'setting': showSettingDialog,
        'see-collect': showCollectDialog,
        'collect': addCollect,
        'home-page': setHome,
        'upload-history': showHistoryDialog,
        'back-login': logout,
    };
    if (actions[cmd]) {
        actions[cmd]();
    } else {
        ElMessage.error('没有这个命令');
    }
};
const { onSelect: onSelectHistory, show: showHistoryDialog } = useHistory();
const logout = () => {
    request('setDefaultAppId', 0);
    router.back();
};

// 拖拽上传
const { progressVisible, active, setDragState, dropFile, uploadingList } = useUpload();
</script>
<style lang="scss" scoped>
@import '@/styles/mixin.scss';
.el-link + .el-link {
    margin-left: 10px;
}
.path {
    white-space: nowrap;
}
.path-name {
    margin-left: 4px;
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
.center {
    text-align: center;
}
.img-dialog-preview {
    max-width: 100%;
}
.table-preview-img {
    max-width: 100px;
}
.file-content {
    max-height: 50vh;
    overflow: auto;
    word-break: break-all;
}
</style>
