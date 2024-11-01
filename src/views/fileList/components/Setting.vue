<template>
    <el-dialog :model-value="visible" width="500px" title="复制样式" @close="close">
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
                <el-radio-group v-model="form.templateType">
                    <el-radio v-for="item in templates" :key="item.id" style="display: block">
                        <span>{{ item.title }}</span>
                        <el-icon :size="14" @click="addTemplate(item)"><edit /></el-icon>
                        <el-icon :size="14" @click="removeTemplate(item)"><remove /></el-icon>
                    </el-radio>
                </el-radio-group>
                <div>
                    <el-button size="small" @click="addTemplate()">添加</el-button>
                </div>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="close">取消</el-button>
            <el-button type="primary" @click="save">保存</el-button>
        </template>
    </el-dialog>
    <template-editor v-model:visible="isShowTemplateEdit" :detail="currentTemplate" />
</template>

<script setup>
import { ref, shallowRef, watch } from 'vue';
import request from '@/helpers/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import { Edit, Remove } from '@element-plus/icons-vue';
import TemplateEditor from './TemplateEditor.vue';

const props = defineProps({
    visible: Boolean,
    setting: Object,
});
const emit = defineEmits(['update:visible', 'submit']);

watch(props, ({ visible }) => {
    if (!visible) {
        return;
    }
    form.value = cloneDeep(props.setting);
    // request("get-template").then((res) => {
    //   templates.value = res;
    // });
});

const form = ref({
    pixel: 2,
    openPreview: false,
});

const templates = ref([]);
const isShowTemplateEdit = shallowRef(false);
const currentTemplate = ref({});
const addTemplate = (item) => {
    currentTemplate.value = item || {};
    isShowTemplateEdit.value = true;
};
const removeTemplate = (item) => {
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
    ElMessage.success('保存成功');
    emit('submit', form.value);
    close();
};
const close = () => {
    emit('update:visible', false);
};
</script>
<style lang="scss" scoped>
.copy-con {
    background: #e1e1e1;
    padding: 10px;
    border-radius: 2px;
}
</style>
