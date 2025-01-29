<template>
    <el-dialog v-model="visible" width="500px" title="复制样式" @close="close" @closed="closed">
        <el-form label-suffix="：">
            <el-form-item label="倍数">
                <el-radio-group v-model="formSetting.pixel">
                    <el-radio :value="2">二倍图</el-radio>
                    <el-radio :value="1">原图</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="预览模式">
                <el-radio-group v-model="formSetting.previewType">
                    <el-radio :value="1">无</el-radio>
                    <el-radio :value="2">缩略图</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="复制模板">
                <div>
                    <div v-if="!isTemplateEditMode">
                        <el-radio-group v-model="formSetting.copyTemplateId" v-if="templates.length">
                            <el-radio v-for="item in templates" :key="item.id" :value="item.id">
                                {{ item.name }}
                            </el-radio>
                        </el-radio-group>
                        <p v-else>无</p>
                    </div>
                    <div v-else>
                        <ul v-if="templates.length">
                            <li v-for="item in templates" :key="item.id" :value="item.id" style="display: block">
                                <span>{{ item.name }}</span>
                                <el-icon :size="14" class="ml10 curp" @click="addTemplate(item)"><edit /></el-icon>
                                <el-icon :size="14" class="ml10 curp" @click="removeTemplate(item)"><remove /></el-icon>
                            </li>
                        </ul>
                        <p v-else>无</p>
                    </div>
                    <div>
                        <el-button size="small" type="primary" @click="addTemplate()">添加</el-button>
                        <el-button
                            size="small"
                            v-if="templates.length"
                            type="primary"
                            @click="isTemplateEditMode = !isTemplateEditMode"
                            >{{ isTemplateEditMode ? '退出编辑' : '编辑' }}</el-button
                        >
                    </div>
                </div>
            </el-form-item>
            <el-form-item label="复制工作流">
                <div>
                    <div v-if="!isWorkflowEditMode">
                        <el-radio-group v-model="formSetting.copyWorkflowId" v-if="workflows.length">
                            <el-radio v-for="item in workflows" :key="item.id" :value="item.id">
                                {{ item.name }}
                            </el-radio>
                        </el-radio-group>
                        <p v-else>无</p>
                    </div>
                    <div v-else>
                        <ul v-if="workflows.length">
                            <li v-for="item in workflows" :key="item.id" :value="item.id" style="display: block">
                                <span>{{ item.name }}</span>
                                <el-icon :size="14" class="ml10 curp" @click="addWorkflow(item)"><edit /></el-icon>
                                <el-icon :size="14" class="ml10 curp" @click="removeWorkflow(item)"><remove /></el-icon>
                            </li>
                        </ul>
                        <p v-else>无</p>
                    </div>
                    <div>
                        <el-button size="small" type="primary" @click="addWorkflow()">添加</el-button>
                        <el-button
                            size="small"
                            v-if="workflows.length"
                            type="primary"
                            @click="isWorkflowEditMode = !isWorkflowEditMode"
                            >{{ isWorkflowEditMode ? '退出编辑' : '编辑' }}</el-button
                        >
                    </div>
                </div>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="close">取消</el-button>
            <el-button type="primary" @click="saveSetting">保存</el-button>
        </template>
    </el-dialog>
    <template-editor @submit="getTemplates" />
    <workflow-editor @submit="getWorkflow" />
</template>

<script setup lang="ts">
import TemplateEditor from './TemplateEditor.vue';
import useTemplate from '../hooks/useTemplate';
import useSetting from '../hooks/useSetting';
import useWorkflow from '../hooks/useWorkflow';
import WorkflowEditor from './Workflow.vue';
import { Edit, Remove } from '@element-plus/icons-vue';

const { getList: getTemplates, templates, openDialog: addTemplate, removeItem: removeTemplate } = useTemplate();

const { saveSetting, formSetting, visible, close, closed, init, isTemplateEditMode } = useSetting();
const {
    getList: getWorkflow,
    list: workflows,
    isEditMode: isWorkflowEditMode,
    openDialog: addWorkflow,
    removeItem: removeWorkflow,
} = useWorkflow();

init(getTemplates);
</script>
<style lang="scss" scoped>
.copy-con {
    background: #e1e1e1;
    padding: 10px;
    border-radius: 2px;
}
</style>
