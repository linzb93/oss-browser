import { type BrowserWindow, Menu } from 'electron';
import { postRenderer, requestRenderer } from '../window/window.service';
import * as ossService from '../oss/oss.service';

/**
 * 执行粘贴：把剪贴板里的文件复制到当前目录
 */
async function paste() {
    const source = ossService.getCopiedFile();
    if (!source) {
        return;
    }
    const targetDir = ossService.getCurrentPath();
    try {
        // 确认是否改名
        const newName = await requestRenderer<string | null>('paste-rename', { name: source.name });
        if (!newName) {
            return;
        }
        // 检查当前目录是否存在同名文件/目录
        const exists =
            (await ossService.objectExists(`${targetDir}${newName}`)) ||
            (await ossService.objectExists(`${targetDir}${newName}/`));
        if (exists) {
            const overwrite = await requestRenderer<boolean>('paste-confirm', { name: newName });
            if (!overwrite) {
                return;
            }
        }
        await ossService.copyFile(source.path, `${targetDir}${newName}`);
        // 粘贴成功后清空剪贴板，右键菜单的「粘贴」项随之隐藏
        ossService.setCopiedFile(null);
        postRenderer('reload');
    } catch (error) {
        console.error(error);
    }
}

export default (win: BrowserWindow) => {
    win.webContents.addListener('context-menu', (_, params) => {
        const rightMenu = Menu.buildFromTemplate([
            {
                label: '创建目录(Ctrl + D)',
                click() {
                    postRenderer('create-directory');
                },
            },
            {
                label: '粘贴',
                visible: !!ossService.getCopiedFile(),
                click() {
                    paste();
                },
            },
            {
                label: '刷新应用',
                click: () => {
                    win.webContents.reload();
                },
            },
            {
                label: '刷新页面',
                click() {
                    postRenderer('reload');
                },
            },
            {
                label: '开发者工具',
                click: () => {
                    win.webContents.openDevTools();
                },
            },
        ]);
        rightMenu.popup({
            x: params.x + 5,
            y: params.y + 15,
        });
    });
};
