import { ref } from 'vue';

const imgPreview = ref({
    /**
     * 控制预览弹窗的显示
     */
    visible: false,
    /**
     * 预览图的网址
     */
    url: '',
    /**
     * 预览弹窗的宽度
     */
    width: 400,
    /**
     * 图片实际宽度
     */
    realWidth: 0,
    /**
     * 图片实际高度
     */
    realHeight: 0,
    /**
     * 预览弹窗的背景颜色
     */
    bgColor: '#fff',
});
const textPreview = ref({
    visible: false,
    content: '',
});
const loadImage = (url: string) => {
    const img = new Image();
    img.src = url;
    img.onload = function () {
        const { width: imgWidth, height: imgHeight } = img;
        imgPreview.value.realWidth = imgWidth;
        imgPreview.value.realHeight = imgHeight;
        const { offsetWidth, offsetHeight } = document.body;
        if (imgWidth / offsetWidth > imgHeight / offsetHeight) {
            // 图片较宽
            if (imgWidth <= 400) {
                imgPreview.value.width = 400;
            } else if (imgWidth > offsetWidth * 0.8) {
                imgPreview.value.width = offsetWidth * 0.8 + 32;
            } else {
                imgPreview.value.width = imgWidth + 32;
            }
        } else {
            // 图片较高
            if (imgHeight > offsetHeight * 0.8) {
                imgPreview.value.width = Math.max(
                    parseInt((((offsetHeight * 0.8 - 32) * imgWidth) / imgHeight).toString()),
                    400
                );
            } else {
                imgPreview.value.width = Math.max(400, imgWidth);
            }
        }
        console.log(imgPreview.value.width);
    };
};
export default () => {
    return {
        imgPreview,
        textPreview,
        loadImage,
        /**
         * 更换预览图背景色
         */
        changeBgColor() {
            if (imgPreview.value.bgColor) {
                imgPreview.value.bgColor = '';
            } else {
                imgPreview.value.bgColor = '#000';
            }
        },
        openPreview(url: string) {
            imgPreview.value.url = url;
            imgPreview.value.visible = true;
            loadImage(url);
        },
    };
};
