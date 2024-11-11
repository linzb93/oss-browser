<template>
    <el-dialog :model-value="visible" width="500px" title="复制样式" @close="close" @closed="closed">
        <el-form label-suffix="：">
            <el-form-item label="倍数">
                <el-radio-group v-model="form.pixel">
                    <el-radio :value="2">二倍图</el-radio>
                    <el-radio :value="1">原图</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="预览模式">
                <el-radio-group v-model="form.previewType">
                    <el-radio :value="1">无</el-radio>
                    <el-radio :value="2">缩略图</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="复制模板">
                <div>
                    <div v-if="!isTemplateEditMode">
                        <el-radio-group v-model="form.copyTemplateId">
                            <el-radio v-for="item in templates" :key="item.id" :value="item.id">
                                {{ item.name }}
                            </el-radio>
                        </el-radio-group>
                    </div>
                    <div v-else>
                        <ul>
                            <li v-for="item in templates" :key="item.id" :value="item.id" style="display: block">
                                <span>{{ item.name }}</span>
                                <el-icon :size="14" class="ml10" @click="addTemplate(item)"><edit /></el-icon>
                                <el-icon :size="14" class="ml10" @click="removeTemplate(item)"><remove /></el-icon>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <el-button size="small" type="primary" @click="addTemplate()">添加</el-button>
                        <el-button size="small" type="primary" @click="isTemplateEditMode = !isTemplateEditMode">{{
                            isTemplateEditMode ? '退出编辑' : '编辑'
                        }}</el-button>
                    </div>
                </div>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="close">取消</el-button>
            <el-button type="primary" @click="save">保存</el-button>
        </template>
    </el-dialog>
    <template-editor v-model:visible="isShowTemplateDialog" :detail="currentTemplate" @submit="getTemplates" />
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import request from '@/helpers/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import { Edit, Remove } from '@element-plus/icons-vue';
import TemplateEditor, { TemplateItem } from './TemplateEditor.vue';

export interface SettingInfo {
    pixel: number;
    previewType: 1 | 2;
    copyTemplateId: number;
    homePath: string;
}

const props = defineProps<{
    visible: boolean;
    setting: SettingInfo;
}>();
const emit = defineEmits(['update:visible', 'submit']);

watch(props, ({ visible }) => {
    if (!visible) {
        return;
    }
    form.value = cloneDeep(props.setting);
    getTemplates();
});

const form = ref<SettingInfo>({
    pixel: 2,
    previewType: 1,
    copyTemplateId: 0,
    homePath: '',
});

const templates = ref<TemplateItem[]>([]);
const isShowTemplateDialog = shallowRef(false);
const isTemplateEditMode = shallowRef(false);
const currentTemplate = ref<TemplateItem>({
    id: 0,
    name: '',
});
const getTemplates = () => {
    request('get-template-list').then((list) => {
        templates.value = list;
    });
};
const addTemplate = (item?: TemplateItem) => {
    currentTemplate.value = (item as TemplateItem) || {};
    isShowTemplateDialog.value = true;
};
const removeTemplate = (item: TemplateItem) => {
    ElMessageBox.confirm('确认删除？', '温馨提醒', {
        confirmButtonText: '删除',
    }).then(() => {
        return request('remove-template', {
            id: item.id,
        });
    });
};
const save = async () => {
    await request('save-setting', form.value);
    ElMessage.success({
        message: '保存成功',
        onClose: () => {
            emit('submit', form.value);
            close();
        },
    });
};
const close = () => {
    emit('update:visible', false);
};
const closed = () => {
    form.value = {
        pixel: 2,
        previewType: 1,
        copyTemplateId: 0,
        homePath: '',
    };
};
</script>
<style lang="scss" scoped>
.copy-con {
    background: #e1e1e1;
    padding: 10px;
    border-radius: 2px;
}
</style>
