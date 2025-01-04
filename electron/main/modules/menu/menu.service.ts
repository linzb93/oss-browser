import { app, shell, Menu, dialog } from 'electron';
import { root } from '../../enums/index.enum';
export default () => {
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
