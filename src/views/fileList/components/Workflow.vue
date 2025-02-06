<template>
    <el-dialog v-model="visible" title="复制工作流" width="500px" @close="close" @closed="closed">
        <!-- <template #title>
            <h3>复制工作流</h3>
            <el-popover title="如何使用" trigger="click">
                <template #reference>
                    <el-icon class="ml5"><QuestionFilled /></el-icon>
                </template>
                <p>复制工作流是可以批量自定义上传文件名称，以及自定义批量复制的格式。</p>
            </el-popover>
        </template> -->
        <el-form ref="formRef" :rules="rules" :model="form" label-suffix="：">
            <el-form-item label="名称">
                <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="命名方式">
                <el-select v-model="form.nameType">
                    <el-option label="原名称" value="originName"></el-option>
                    <el-option label="索引值" value="index"></el-option>
                    <el-option label="唯一值" value="uid"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="复制模板类型">
                <el-select v-model="form.templateType">
                    <el-option label="纯文本" value="plainText"></el-option>
                    <el-option label="JSON" value="json" disabled></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="复制模板内容">
                <el-input v-model="form.templateContent" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="close">取消</el-button>
            <el-button type="primary" @click="save">保存</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, readonly } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import useWorkflow from '../hooks/useWorkflow';
const { visible, saveAction, close, closed } = useWorkflow();
const form = ref({
    nameType: '',
    templateType: '',
    templateContent: '',
});
const rules = readonly({});
const formRef = ref(null);
const emit = defineEmits(['submit']);
const save = () =>
    saveAction().then(() => {
        emit('submit');
        close();
    });
</script>
<style lang="scss" scoped></style>
