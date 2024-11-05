<template>
    <div
        class="wrap"
        :class="{ active: active }"
        @dragover.prevent="setDragState(true)"
        @drop="dropFile"
        @dragleave="setDragState(false)"
    >
        <div class="layer flex-center" @keyup="setDragState(false)">
            <p class="tips">请将需要上传的文件拖拽至此</p>
        </div>
        <div class="path mb10 flexalign-center">
            <template v-if="breadcrumb.length">
                <el-icon
                    :size="16"
                    class="mr10 curp"
                    @click="
                        popBreadCrumb();
                        getList();
                    "
                    ><back
                /></el-icon>
                <el-icon
                    @click="
                        setBreadCrumb(-1);
                        getList();
                    "
                    class="curp"
                    :size="16"
                >
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
                @click="
                    setBreadCrumb(index);
                    getList();
                "
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
                <el-button type="primary" @click="createDir">创建文件夹</el-button>
                <el-dropdown class="ml10" @command="batchCommand">
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
            <context-menu
                :menus="[
                    {
                        title: '创建文件夹',
                        onClick() {
                            createDir();
                        },
                    },
                ]"
            >
                <el-table :data="tableList" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" :selectable="(row) => row.type !== 'dir'" width="35" />
                    <el-table-column label="名称">
                        <template #default="scope">
                            <div class="flexalign-center">
                                <el-icon v-if="scope.row.type === 'dir'" :size="16" style="margin-right: 5px">
                                    <folder />
                                </el-icon>
                                <file-type-icon :type="pathUtil.extname(scope.row.name)" v-else />
                                <span class="file-name" @click="jumpInner(scope.row)">{{ scope.row.name }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="预览图" v-if="setting.previewType === 2">
                        <template #default="scope">
                            <img
                                v-if="isPic(scope.row)"
                                class="table-preview-img curp"
                                :src="scope.row.url"
                                @click="jumpInner(scope.row)"
                            />
                        </template>
                    </el-table-column>
                    <el-table-column label="类型/大小">
                        <template #default="scope">
                            <template v-if="scope.row.type === 'dir'">目录</template>
                            <template v-else>{{ getSize(scope.row) }}</template>
                        </template>
                    </el-table-column>
                    <el-table-column label="最后修改时间">
                        <template #default="scope">
                            {{
                                scope.row.type === 'dir'
                                    ? ''
                                    : dayjs(scope.row.lastModified).format('YYYY-MM-DD HH:mm:ss')
                            }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作">
                        <template #default="scope">
                            <template v-if="scope.row.type !== 'dir'">
                                <el-link type="primary" :underline="false" @click="requestUtil.copy(scope.row.url)"
                                    >获取地址</el-link
                                >
                                <el-link
                                    type="primary"
                                    :underline="false"
                                    class="mr10"
                                    @click="requestUtil.download(scope.row.url)"
                                    >下载</el-link
                                >
                                <el-link
                                    type="primary"
                                    :underline="false"
                                    class="mr10"
                                    style="margin-left: 0"
                                    v-if="isPic(scope.row)"
                                    @click="getCss(scope.row)"
                                    >复制样式</el-link
                                >
                                <delete-confirm @confirm="del(scope.row)"></delete-confirm>
                            </template>
                            <span v-else>-</span>
                        </template>
                    </el-table-column>
                </el-table>
            </context-menu>
        </div>
    </div>
    <upload-history v-model:visible="visible.history" :domain="userInfo.domain" @select="onSelectHistory" />
    <progress-drawer
        v-model:visible="progressVisible"
        :upload-list="uploadingList"
        :path="fullPath"
        @refresh="getList()"
    />
    <collect-pane
        v-model:visible="visible.collect"
        @enter="
            (path) => {
                initBreadCrumb(path);
                getList();
            }
        "
    />
    <setting-dialog
        v-model:visible="visible.setting"
        :setting="setting"
        @submit="
            (data) =>
                (setting = {
                    ...setting,
                    ...data,
                })
        "
    />
    <el-dialog v-model="visible.preview" title="图片预览" :width="`450px`">
        <div class="center">
            <img :src="previewUrl" class="img-dialog-preview" />
        </div>
        <template #footer>
            <el-button type="primary" @click="requestUtil.open('web', previewUrl)">在浏览器打开</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, shallowRef, shallowReactive, onMounted, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { Folder, ArrowRight, HomeFilled, ArrowDown, Back } from '@element-plus/icons-vue';
import { getSize } from '@/helpers/size';
import useUpload from './hooks/useUpload';
import useBreadcrumb from './hooks/useBreadcrumb';
import pathUtil from '@/helpers/path';
import { scrollTo } from '@/helpers/scroll-to';
import request, { requestUtil } from '@/helpers/request';
import FileTypeIcon from '@/components/FileTypeIcon.vue';
import DeleteConfirm from '@/components/DeleteConfirm.vue';
import ContextMenu from '@/components/ContextMenu.vue';
import ProgressDrawer from './components/Progress.vue';
import MsgBoxFileList from './components/FileList.vue';
import SettingDialog from './components/Setting.vue';
import UploadHistory from './components/UploadHistory.vue';
import CollectPane from './components/CollectPane.vue';

const router = useRouter();

const tableList = shallowRef([]);
const {
    breadcrumb,
    fullPath,
    init: initBreadCrumb,
    push: pushBreadCrumb,
    pop: popBreadCrumb,
    set: setBreadCrumb,
} = useBreadcrumb();
const visible = shallowReactive({
    progress: false,
    preview: false,
    setting: false,
    history: false,
    collect: false,
});
const loading = shallowRef(true);
const finished = shallowRef(false);
const disabled = computed(() => loading.value || finished.value);
// 获取文件列表
const getList = async (isConcat) => {
    loading.value = true;
    if (!isConcat) {
        finished.value = false;
        scrollTo(0, 800, '.other-wrap');
    }
    try {
        const data = await request('oss-get-list', {
            prefix: fullPath.value,
            useToken: isConcat,
        });
        loading.value = false;
        if (isConcat) {
            tableList.value = tableList.value.concat(data.list);
        } else {
            tableList.value = data.list;
        }
        finished.value = !data.token;
    } catch (error) {
        loading.value = false;
        finished.value = true;
        ElMessage.error('接口故障，请稍后再试');
    }
};
const userInfo = ref({});
onMounted(async () => {
    userInfo.value = await request('login-get');
    if (!userInfo.value.id) {
        router.push('/login');
    } else {
        getSetting().then(() => {
            getList();
        });
    }
});

// 获取设置
const getSetting = async () => {
    const data = await request('get-setting');
    setting.value = {
        ...setting.value,
        ...data,
    };
    if (setting.value.homePath) {
        initBreadCrumb(setting.value.homePath);
    }
};

// 多选，目前只能选择文件，不能选择目录
const selected = ref([]);
const handleSelectionChange = (selection) => {
    selected.value = selection.filter((item) => item.type !== 'dir');
};

// 确认是否有多选
const checkMultiSelect = () => {
    if (selected.value.length) {
        return true;
    }
    ElMessage.error('请选择至少一个');
    return false;
};

// 批量操作
const batchCommand = (command) => {
    const actions = {
        download: async () => {
            if (!checkMultiSelect()) {
                return;
            }
            await requestUtil.download(selected.value.map((item) => item.url).join(','));
            selected.value = [];
        },
        delete: () => {
            if (!checkMultiSelect()) {
                return;
            }
            ElMessageBox({
                message: h(MsgBoxFileList, {
                    list: selected.value.map((item) => item.name),
                    tips: '确认删除以下文件：',
                }),
                title: '温馨提醒',
                showCancelButton: true,
                confirmButtonText: '删除',
                cancelButtonText: '取消',
            }).then(async () => {
                await request('oss-delete', {
                    path: selected.value.map((item) => `${fullPath.value}${item.name}`).join(','),
                });
                ElMessage.success('删除成功');
                selected.value = [];
                getList();
            });
        },
        copy: async () => {
            if (!checkMultiSelect()) {
                return;
            }
            requestUtil.copy(selected.value.map((item) => item.url).join('\n'));
        },
    };
    if (actions[command]) {
        actions[command]();
    }
};

// 删除文件
const del = async (item) => {
    const name = item.type === 'dir' ? `${item.name}/` : item.name;
    await request('oss-delete', {
        path: `${fullPath.value}${name}`,
    });
    ElMessage.success('删除成功');
    getList();
};

// 图片预览
const previewUrl = shallowRef('');
const isPic = (item) => {
    return ['jpg', 'png', 'jpeg', 'gif'].includes(pathUtil.extname(item.name));
};
// 进入文件夹内层
const jumpInner = (item) => {
    if (item.size > 0) {
        // 是图片
        if (isPic(item)) {
            previewUrl.value = item.url;
            visible.preview = true;
        }
        return;
    }
    pushBreadCrumb(item.name);
    getList();
};

// 创建文件夹
const createDir = () => {
    ElMessageBox.prompt('请输入文件夹名称', '温馨提醒', {
        confirmButtonText: '创建',
        beforeClose: (action, instance, done) => {
            if (action !== 'confirm') {
                done();
                return;
            }
            if (!instance.inputValue) {
                ElMessage.error('请输入文件夹名称');
                return;
            }
            done();
        },
    })
        .then(async ({ value }) => {
            if (tableList.value.some((file) => file.type === 'dir' && file.name === value)) {
                ElMessage.warning('存在同名文件夹，无需创建');
                return;
            }
            await request('oss-add-path', {
                prefix: fullPath.value,
                name: value,
                type: 'directory',
            });
            ElMessage.success('创建成功');
            getList();
        })
        .catch(() => {
            //
        });
};

// 更多功能
const moreCommand = async (cmd) => {
    if (cmd === 'setting') {
        visible.setting = true;
        return;
    }
    if (cmd === 'see-collect') {
        visible.collect = true;
        return;
    }
    if (cmd === 'collect') {
        await request('add-collect', {
            path: fullPath.value,
        });
        ElMessage.success('添加成功');
        return;
    }
    if (cmd === 'home-page') {
        await request('set-home', {
            path: fullPath.value.replace(/\/$/, ''),
        });
        ElMessage.success('设置成功');
        return;
    }
    if (cmd === 'upload-history') {
        visible.history = true;
        return;
    }
    if (cmd === 'back-login') {
        router.push('/login');
        return;
    }
    ElMessage.error('没有这个命令');
};

const onSelectHistory = (filePath) => {
    const { pathname } = new URL(`${userInfo.value.domain}/${filePath}`);
    breadcrumb.value = pathname.split('/').slice(1, -1);
    getList();
};

// 拖拽上传
const { progressVisible, active, setDragState, dropFile, uploadingList } = useUpload(tableList.value);

const getCss = (item) => {
    const img = new Image();
    img.src = item.url;
    img.onload = function () {
        const { width, height } = this;
        request('copy-template', {
            width,
            height,
            url: item.url,
        })
            .then(() => {
                ElMessage.success('复制成功');
            })
            .catch((e) => {
                ElMessage.error(e.message);
            });
    };
};

const setting = ref({
    pixel: 2,
    previewType: 1,
    homePath: '',
    copyTemplateId: null,
});
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
    &:hover {
        color: #409eff;
    }
}
.other-wrap {
    position: absolute;
    top: 65px;
    bottom: 10px;
    left: 0;
    width: 100%;
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
    max-width: 400px;
}
.table-preview-img {
    max-width: 100px;
}
</style>
