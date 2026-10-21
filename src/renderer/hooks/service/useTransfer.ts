import { ref, h } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import MsgBoxFileList from "@/renderer/components/FileList.vue";
import AskDeleteSource from "@/renderer/components/AskDeleteSource.vue";
import { type TableItem, type UploadedTableItem } from "@/shared/types";
import { removeLocalFiles, uploadFiles } from "@/renderer/api";
import { useBreadcrumb } from "@/renderer/hooks/common/useBreadcrumb";
import { useSettingStore } from "@/renderer/hooks/common/useSetting";
import { handleMainPost } from "@/renderer/utils";

const { fullPath } = useBreadcrumb();
const active = ref(false);

/**
 * 设置拖拽状态
 * @param {boolean} state - 拖拽状态
 */
const setDragState = (state: boolean) => {
    active.value = state;
};

const progressVisible = ref(false);
const uploadingList = ref<TableItem[]>([]);
const transferFinished = ref(false);
const uploading = ref(false);
/**
 * 每次上传对应的本地源文件，按上传发起顺序排队；
 * 上传完成后按「上传完成后删除源文件」的设置决定是否删除、是否询问用户
 */
const sourceQueue: string[][] = [];
/**
 * 是否已经开始监听上传完成事件，避免重复注册
 */
let watchingUpload = false;

/**
 * 删除本地源文件
 * @param {string[]} paths - 本地文件绝对路径
 */
const deleteSourceFiles = async (paths: string[]) => {
    try {
        await removeLocalFiles(paths);
        ElMessage.success("已删除源文件");
    } catch (error) {
        ElMessage.error((error as { message?: string } | null)?.message || "源文件删除失败");
    }
};

/**
 * 上传完成后处理源文件：开启设置时直接删除，否则按需询问用户
 * @param {string[]} paths - 本次上传的本地源文件
 */
const handleSourceFiles = async (paths: string[]) => {
    const { setting, updateSetting } = useSettingStore();
    if (setting.value.deleteSourceFile) {
        await deleteSourceFiles(paths);
        return;
    }
    // 用户在设置中主动关闭后，不再询问
    if (!setting.value.askDeleteSourceFile) {
        return;
    }
    // 用户是否勾选了「以后都自动删除源文件，不再询问」
    let alwaysDelete = false;
    try {
        await ElMessageBox({
            title: "温馨提示",
            message: h(AskDeleteSource, {
                onChange: (checked: boolean) => {
                    alwaysDelete = checked;
                },
            }),
            showCancelButton: true,
            confirmButtonText: "删除"
        });
    } catch {
        // 用户选择不删除
        return;
    }
    await deleteSourceFiles(paths);
    if (alwaysDelete) {
        // 勾选「以后都这样」后，把设置项改成「是」，之后上传完成直接删除
        try {
            await updateSetting({ deleteSourceFile: true });
        } catch {
            ElMessage.warning("设置保存失败，下次上传后仍会询问");
        }
    }
};

/**
 * 监听上传完成事件（只需注册一次）
 */
const watchUploadFinished = () => {
    if (watchingUpload) {
        return;
    }
    watchingUpload = true;
    handleMainPost("upload-progress", async ({ type }: { type: "uploading" | "upload-finished" }) => {
        if (type !== "upload-finished") {
            return;
        }
        const paths = sourceQueue.shift();
        if (!paths?.length) {
            return;
        }
        await handleSourceFiles(paths);
    });
};

/**
 * 文件上传操作钩子
 */
export function useTransfer(options?: {
    afterUploadCallback?:Function
}) {
    /**
   * 处理文件拖拽事件
   * @param {DragEvent} event - 拖拽事件
   * @param {TableItem[]} tableList - 目标文件列表
   * @param {string} prefix - 前缀路径
   */
    const dropFile = async (
        event: DragEvent,
        tableList: TableItem[],
        prefix: string,
    ) => {
        active.value = false;
        const files = event.dataTransfer?.files as FileList;
        const upOriginList = Array.from(files) as unknown as UploadedTableItem[];
        const resolveList = await new Promise<UploadedTableItem[]>((resolve) => {
            // 过滤重名文件，其他正常上传
            const duplicateFiles = upOriginList.filter((item) =>
                tableList.find((sub) => sub.name === item.name),
            );
            if (duplicateFiles.length) {
                ElMessageBox({
                    message: h(MsgBoxFileList, {
                        list: duplicateFiles.map((item) => ({
                            name: item.name,
                            path: URL.createObjectURL(item as unknown as Blob),
                            onlineUrl: `${prefix}/${tableList.find((sub) => sub.name === item.name)?.path}`,
                        })),
                        tips: "下列文件已存在，是否覆盖？",
                        showCompare:true
                    }),
                    title: "温馨提醒",
                    showCancelButton: true,
                    confirmButtonText: "覆盖",
                    cancelButtonText: "不覆盖",
                })
                    .then(() => {
                        resolve(upOriginList);
                    })
                    .catch(() => {
                        resolve(
                            upOriginList.filter(
                                (item) => !duplicateFiles.find((d) => d.name === item.name),
                            ),
                        );
                    })
                    .catch(console.log);
            } else {
                resolve(upOriginList);
            }
        });
        if (resolveList.length) {
            const localPaths = resolveList.map((item) => window.webUtils.getPathForFile(item as unknown as File));
            // 先入队再发起上传，上传完成事件到达时按顺序处理源文件
            sourceQueue.push(localPaths);
            watchUploadFinished();
            try {
                await uploadFiles({
                    prefix: fullPath.value,
                    type: "file",
                    names: localPaths.join(","),
                });
            } catch (error) {
                sourceQueue.pop();
                ElMessage.error((error as { message?: string } | null)?.message || "上传失败");
                return;
            }
            if (typeof options?.afterUploadCallback === 'function') {
                options.afterUploadCallback();
            }
        } else {
            ElMessage.warning("上传取消");
        }
    };
    return {
        progressVisible,
        dragActive: active,
        setDragState,
        dropFile,
        uploadingList,
        transferFinished,
        uploading,
    };
}
