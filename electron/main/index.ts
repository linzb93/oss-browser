import { app, BrowserWindow, shell, ipcMain, Menu, dialog } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import registerRoute from "./app/router";
import isDev from "electron-is-dev";
import unhandled from "electron-unhandled";
import { root, publicPath } from "./app/helper/constant";
unhandled();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, "public")
    : RENDERER_DIST;

const isMac = process.platform === "darwin";

// Set application name for Windows 10+ notifications
if (!isMac) app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
    win = new BrowserWindow({
        title: "OSS Browser",
        webPreferences: {
            spellcheck: false,
            preload,
        },
    });

    if (VITE_DEV_SERVER_URL) {
        // #298
        win.loadURL(VITE_DEV_SERVER_URL);
        // Open devTool if the app is not packaged
        // win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml);
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send("main-process-message", new Date().toLocaleString());
    });

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("https:")) shell.openExternal(url);
        return { action: "deny" };
    });
    // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(() => {
    createWindow();
    const menu = Menu.buildFromTemplate([
        {
            label: "应用",
            submenu: [
                { role: "reload" },
                {
                    label: "about",
                    click: () => {
                        dialog.showMessageBox({
                            title: "关于我们",
                            message: `${app.getVersion()}\n @copyright ${new Date().getFullYear()} linzb93`,
                        });
                    },
                },
                { type: "separator" },
                { role: "quit" },
            ],
        },
        {
            label: "调试",
            submenu: [
                { role: "toggleDevTools" },
                {
                    label: "打开缓存页面",
                    click: () => {
                        shell.openPath(root);
                    },
                },
            ],
        },
    ]);
    Menu.setApplicationMenu(menu);
    registerRoute();
});

app.on("window-all-closed", () => {
    win = null;
    if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on("activate", () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        createWindow();
    }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
    } else {
        childWindow.loadFile(indexHtml, { hash: arg });
    }
});
