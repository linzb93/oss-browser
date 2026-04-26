import { ref } from 'vue';

const currentImage = ref({
    url: '',
    width: 0,
    height: 0,
});
const compareImage = ref({
    url: '',
    width: 0,
    height: 0,
});
const visible = ref(false);

const dialogWidth = ref('80%');
const dialogBodyHeight = ref('60vh');

/**
 * 对数字进行范围限制
 * @param {number} value - 要限制的数字
 * @param {number} min - 下限
 * @param {number} max - 最大值
 * @returns {number} 数字限制后的结果
 * @example
 * clamp(10, 0, 5) // 5
 * clamp(-5, 0, 5) // 0
 */
const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
};

/**
 * 计算对话框宽度和内容高度，根据图片自然尺寸，限制在50%~80%的当前客户端大小
 */
const calculateDialogSize = () => {
    const innerWidth = window.innerWidth || 0;
    const innerHeight = window.innerHeight || 0;
    if (!innerWidth || !innerHeight) return;

    const minWidth = innerWidth * 0.5;
    const maxWidth = innerWidth * 0.8;
    const minHeight = innerHeight * 0.5;
    const maxHeight = innerHeight * 0.8;

    const maxImgWidth = Math.max(currentImage.value.width || 0, compareImage.value.width || 0);
    const maxImgHeight = Math.max(currentImage.value.height || 0, compareImage.value.height || 0);

    const paneGap = 10;
    const extraWidth = 80;
    const dialogHeaderHeight = 54;
    const bodyPaddingY = 32;
    const textAreaHeight = 64;

    const targetWidth = maxImgWidth * 2 + paneGap + extraWidth;
    const targetHeight = maxImgHeight + textAreaHeight + bodyPaddingY + dialogHeaderHeight;

    const finalWidth = clamp(targetWidth, minWidth, maxWidth);
    const finalHeight = clamp(targetHeight, minHeight, maxHeight);

    dialogWidth.value = `${Math.round(finalWidth)}px`;
    dialogBodyHeight.value = `${Math.max(0, Math.round(finalHeight - dialogHeaderHeight - bodyPaddingY - 2))}px`;
};

/**
 * 打开对比对话框并预加载两张图片
 * @param {string} preUrl - 上一张图片的 URL
 * @param {string} onlineUrl - 当前图片的 URL
 */
const openDialog = (preUrl: string, onlineUrl: string) => {
    visible.value = true;
    currentImage.value.url = onlineUrl;
    compareImage.value.url = preUrl || '';
    currentImage.value.width = 0;
    currentImage.value.height = 0;
    compareImage.value.width = 0;
    compareImage.value.height = 0;
    calculateDialogSize();
    const img1 = new Image();
    img1.src = onlineUrl;
    img1.onload = () => {
        currentImage.value.width = img1.width;
        currentImage.value.height = img1.height;
        calculateDialogSize();
    };
    img1.onerror = () => {
        currentImage.value.width = 0;
        currentImage.value.height = 0;
        calculateDialogSize();
    };
    const img2 = new Image();
    img2.src = preUrl || '';
    img2.onload = () => {
        compareImage.value.width = img2.width;
        compareImage.value.height = img2.height;
        calculateDialogSize();
    };
    img2.onerror = () => {
        compareImage.value.width = 0;
        compareImage.value.height = 0;
        calculateDialogSize();
    };
};
/**
 * 图片对比对话框钩子
 */
export const useCompare = () => {
    return {
        visible,
        currentImage,
        compareImage,
        dialogWidth,
        dialogBodyHeight,
        openDialog,
    };
};
