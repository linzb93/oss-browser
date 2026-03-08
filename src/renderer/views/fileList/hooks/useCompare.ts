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
const openDialog = (preUrl: string, onlineUrl: string) => {
    visible.value = true;
    currentImage.value.url = onlineUrl;
    compareImage.value.url = preUrl || '';
    const img1 = new Image();
    img1.src = onlineUrl;
    img1.onload = () => {
        currentImage.value.width = img1.width;
        currentImage.value.height = img1.height;
    };
    const img2 = new Image();
    img2.src = preUrl || '';
    img2.onload = () => {
        compareImage.value.width = img2.width;
        compareImage.value.height = img2.height;
    };
};
export default () => {
    return {
        visible,
        currentImage,
        compareImage,
        openDialog,
    };
};
