<template>
    <el-form label-suffix="：" label-width="160px">
        <el-form-item label="上传完成后删除源文件">
            <el-radio-group v-model="setting.deleteSourceFile" @change="onChange">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
            </el-radio-group>
        </el-form-item>
    </el-form>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { useSettingStore } from '@/renderer/hooks/common/useSetting';

const { setting, updateSetting } = useSettingStore();

/**
 * 修改「上传完成后删除源文件」。
 * 在设置中主动选择「否」后，上传完成不再询问是否删除源文件。
 * @param {boolean} value - 是否删除源文件
 */
const onChange = async (value: boolean) => {
    const deleteSourceFile = value === true;
    try {
        await updateSetting({
            deleteSourceFile,
            // 主动关闭后不再询问，与在提示框里勾选「以后都这样」互斥
            askDeleteSourceFile: deleteSourceFile ? (setting.value.askDeleteSourceFile ?? true) : false,
        });
        ElMessage.success({
            message: '保存成功',
            duration: 1500,
        });
    } catch (error) {
        // 保存失败时回滚，避免界面与已保存的设置不一致
        setting.value.deleteSourceFile = !deleteSourceFile;
        ElMessage.error((error as { message?: string } | null)?.message || '保存失败');
    }
};
</script>
<style lang="scss" scoped></style>
