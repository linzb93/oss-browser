import { shallowRef, ref, h, Ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import MsgBoxFileList from '../components/FileList.vue';
import { getSize } from '@/helpers/size';
import { type TableItem } from '../shared/types';
export { type TableItem };

const active = shallowRef(false);

const setDragState = (state: boolean) => {
    active.value = state;
};

const progressVisible = shallowRef(false);
const uploadingList = ref<TableItem[]>([]);

type getTableListCallbackType = () => Ref<TableItem[]>;

export default function useUpload() {
    const list = ref<TableItem[]>([]);
    let getTableListCallback: getTableListCallbackType;
    const setTableList = (cb: getTableListCallbackType) => {
        getTableListCallback = cb;
    };
    const dropFile = async (event: DragEvent) => {
        active.value = false;
        const upOriginList = Array.from(event.dataTransfer?.files as unknown as TableItem[]);
        const list = getTableListCallback();
        const resolveList: TableItem[] = await new Promise((resolve) => {
            // 过滤重名文件，其他正常上传
            const duplicateFiles = upOriginList.filter((item) => list.value.find((sub) => sub.name === item.name));
            if (duplicateFiles.length) {
                ElMessageBox({
                    message: h(MsgBoxFileList, {
                        list: duplicateFiles.map((item) => item.name),
                        tips: '下列文件已存在，是否覆盖？',
                    }),
                    title: '温馨提醒',
                    showCancelButton: true,
                    confirmButtonText: '覆盖',
                    cancelButtonText: '不覆盖',
                })
                    .then(() => {
                        resolve(upOriginList);
                    })
                    .catch(() => {
                        resolve(upOriginList.filter((item) => !duplicateFiles.find((d) => d.name === item.name)));
                    })
                    .catch(console.log);
            } else {
                resolve(upOriginList);
            }
        });
        if (resolveList.length) {
            uploadingList.value = resolveList.map((item) => ({
                name: item.name,
                path: item.path,
                size: item.size,
                url: '',
                sizeFormat: getSize(item),
            }));
            progressVisible.value = true;
        } else {
            ElMessage.warning('没有文件需要上传');
        }
    };
    return {
        setTableList,
        progressVisible,
        active,
        setDragState,
        dropFile,
        uploadingList,
    };
}
