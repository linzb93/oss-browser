// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ElementPlus, { ElMessage } from 'element-plus';
import { saveSetting } from '@/renderer/api';
import { useSettingStore } from '@/renderer/hooks/common/useSetting';
import General from './General.vue';

vi.mock('@/renderer/api', () => ({
    getSetting: vi.fn(),
    saveSetting: vi.fn(),
}));

const saveSettingMock = vi.mocked(saveSetting);
const { setting } = useSettingStore();

/**
 * 挂载「通用设置」页签
 */
const mountGeneral = () => mount(General, { global: { plugins: [ElementPlus] } });

/**
 * 获取单选组组件
 * @param wrapper 挂载后的组件
 */
const getRadioGroup = (wrapper: ReturnType<typeof mountGeneral>) =>
    wrapper.findComponent({ name: 'ElRadioGroup' });

describe('通用设置', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        saveSettingMock.mockResolvedValue(undefined);
        vi.spyOn(ElMessage, 'success').mockReturnValue({} as ReturnType<typeof ElMessage.success>);
        vi.spyOn(ElMessage, 'error').mockReturnValue({} as ReturnType<typeof ElMessage.error>);
        setting.value = {
            pixel: 1,
            previewType: 1,
            copyTemplateId: 0,
            homePath: '',
            deleteSourceFile: false,
            askDeleteSourceFile: true,
        };
    });

    it('默认选择「否」', () => {
        const wrapper = mountGeneral();
        expect(getRadioGroup(wrapper).props('modelValue')).toBe(false);
        const checked = wrapper.findAll('.el-radio').find((radio) => radio.classes().includes('is-checked'));
        expect(checked?.text()).toContain('否');
    });

    it('改成「是」时保存，并保留「是否询问」标记', async () => {
        const wrapper = mountGeneral();
        await wrapper.findAll('input[type="radio"]')[0].setValue(true);
        await flushPromises();
        expect(saveSettingMock).toHaveBeenCalledWith(
            expect.objectContaining({ deleteSourceFile: true, askDeleteSourceFile: true }),
        );
    });

    it('改成「否」时同时关闭后续询问', async () => {
        setting.value.deleteSourceFile = true;
        const wrapper = mountGeneral();
        await wrapper.findAll('input[type="radio"]')[1].setValue(true);
        await flushPromises();
        expect(saveSettingMock).toHaveBeenCalledWith(
            expect.objectContaining({ deleteSourceFile: false, askDeleteSourceFile: false }),
        );
    });
});
