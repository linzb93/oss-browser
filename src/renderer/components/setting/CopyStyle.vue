<template>
  <el-form label-suffix="：" label-width="110px">
    <el-form-item label="图片倍数">
      <el-radio-group v-model="formSetting.pixel" @change="save">
        <el-radio :value="2">二倍图</el-radio>
        <el-radio :value="1">原图</el-radio>
      </el-radio-group>
    </el-form-item>
    <!-- <el-form-item label="图片预览模式">
      <el-radio-group v-model="formSetting.previewType">
        <el-radio :value="1">无</el-radio>
        <el-radio :value="2">缩略图</el-radio>
      </el-radio-group>
    </el-form-item> -->
    <el-form-item label="复制模板">
      <div>
        <div v-if="!isTemplateEditMode">
          <el-radio-group v-model="formSetting.copyTemplateId" v-if="templates.length" @change="save">
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
              <el-icon :size="14" class="ml10 curp" @click="addTemplate(item)">
                <edit />
              </el-icon>
              <el-icon :size="14" class="ml10 curp" @click="removeTemplate(item)">
                <remove />
              </el-icon>
            </li>
          </ul>
          <p v-else>无</p>
        </div>
        <div>
          <el-button size="small" type="primary" @click="addTemplate()">添加</el-button>
          <el-button size="small" v-if="templates.length" type="primary"
            @click="isTemplateEditMode = !isTemplateEditMode">{{ isTemplateEditMode ? '退出编辑' : '编辑' }}</el-button>
        </div>
      </div>
    </el-form-item>
  </el-form>
  <template-editor @submit="getTemplates" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import TemplateEditor from '@/renderer/components/TemplateEditor.vue';
import { useTemplate } from '@/renderer/hooks/service/useTemplate';
import { useSettingStore } from '@/renderer/hooks/common/useSetting';
import { Edit, Remove } from '@element-plus/icons-vue';
import type { SettingInfo } from '@/shared/types';
const { getList: getTemplates, templates, openDialog: addTemplate, removeItem: removeTemplate } = useTemplate();

const { saveSetting, setting } = useSettingStore();

const formSetting = ref<SettingInfo>({} as SettingInfo);
const isTemplateEditMode = ref(false);


const save = async () => {
    await saveSetting(formSetting.value);
    ElMessage.success({
        message: '保存成功',
        duration: 1500,
        onClose() {
            
        },
    });
};
</script>
<style lang="scss" scoped>
.copy-con {
    background: #e1e1e1;
    padding: 10px;
    border-radius: 2px;
}
</style>