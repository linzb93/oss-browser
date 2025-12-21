import { shallowRef, ref, h } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import MsgBoxFileList from '../components/FileList.vue';
import useTable from './useTable';
import { getSize } from '@/helpers/size';
import { type TableItem, type UploadedTableItem } from '../shared/types';

const active = shallowRef(false);

const setDragState = (state: boolean) => {
    active.value = state;
};

const progressVisible = shallowRef(false);
const uploadingList = ref<TableItem[]>([]);

export default function useUpload() {
    const { tableList } = useTable();
    const dropFile = async (event: DragEvent) => {
        active.value = false;
        const files = event.dataTransfer?.files as FileList;
        const upOriginList = Array.from(files) as UploadedTableItem[];
        const resolveList = await new Promise<UploadedTableItem[]>((resolve) => {
            // 过滤重名文件，其他正常上传
            const duplicateFiles = upOriginList.filter((item) => tableList.value.find((sub) => sub.name === item.name));
            if (duplicateFiles.length) {
                ElMessageBox({
                    message: h(MsgBoxFileList, {
                        list: duplicateFiles.map((item) => ({
                            name: item.name,
                            path: URL.createObjectURL(item as unknown as Blob),
                            onlineUrl: tableList.value.find((sub) => sub.name === item.name)?.url,
                        })),
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
        progressVisible,
        active,
        setDragState,
        dropFile,
        uploadingList,
    };
}
