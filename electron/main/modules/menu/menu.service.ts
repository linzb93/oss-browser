import { app, shell, type BrowserWindow, Menu, dialog } from 'electron';
import { root } from '../../enums/index.enum';
import { postRenderer } from '../window/window.service';
export default (win: BrowserWindow) => {
    const menu = Menu.buildFromTemplate([
        {
            label: '应用',
            submenu: [
                { role: 'reload' },
                {
                    label: 'about',
                    click: () => {
                        dialog.showMessageBox({
                            title: '关于我们',
                            message: `${app.getVersion()}\n @copyright ${new Date().getFullYear()} linzb93`,
                        });
                    },
                },
                {
                    label: '返回上一级',
                    accelerator: 'Backspace',
                    visible: false,
                    click: () => {
                        postRenderer('back');
                    },
                },
                {
                    label: '切换上一个',
                    accelerator: 'Up',
                    visible: false,
                    click: () => {
                        postRenderer('location', {
                            isDown: false,
                        });
                    },
                },
                {
                    label: '切换下一个',
                    accelerator: 'Down',
                    visible: false,
                    click: () => {
                        postRenderer('location', {
                            isDown: true,
                        });
                    },
                },
                {
                    label: '打开文件',
                    accelerator: 'Enter',
                    visible: false,
                    click: () => {
                        postRenderer('enter', {});
                    },
                },
                {
                    label: '创建目录',
                    accelerator: 'Ctrl + D',
                    visible: false,
                    click: () => {
                        postRenderer('create-dir');
                    },
                },
                {
                    label: '复制地址',
                    accelerator: 'Ctrl + Shift + U',
                    visible: false,
                    click: () => {
                        postRenderer('copy-url');
                    },
                },
                {
                    label: '复制样式',
                    accelerator: 'Ctrl + Shift + C',
                    visible: false,
                    click: () => {
                        postRenderer('copy-style');
                    },
                },
                { type: 'separator' },
                { role: 'quit' },
            ],
        },
        {
            label: '调试',
            submenu: [
                {
                    label: '打开缓存页面',
                    click: () => {
                        shell.openPath(root);
                    },
                },
                { role: 'copy' },
                { role: 'paste' },
            ],
        },
    ]);
    Menu.setApplicationMenu(menu);
};
