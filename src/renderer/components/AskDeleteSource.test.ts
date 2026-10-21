// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import AskDeleteSource from './AskDeleteSource.vue';

/**
 * 挂载删除源文件提示框的内容组件
 */
const mountAskDeleteSource = () => mount(AskDeleteSource, { global: { plugins: [ElementPlus] } });

describe('AskDeleteSource', () => {
    it('默认未勾选', () => {
        const wrapper = mountAskDeleteSource();
        expect(wrapper.text()).toContain('是否删除源文件');
        expect(wrapper.findComponent({ name: 'ElCheckbox' }).props('modelValue')).toBe(false);
    });

    it('勾选后向外抛出 change 事件', async () => {
        const wrapper = mountAskDeleteSource();
        const input = wrapper.find('input[type="checkbox"]');
        await input.setValue(true);
        expect(wrapper.emitted('change')?.[0]).toEqual([true]);
        expect((input.element as HTMLInputElement).checked).toBe(true);
        expect(wrapper.findComponent({ name: 'ElCheckbox' }).props('modelValue')).toBe(true);
    });
});
