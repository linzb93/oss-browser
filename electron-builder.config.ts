import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import dotenv from 'dotenv';
import { type Configuration } from 'electron-builder';

/**
 * electron-builder 配置（TS 版本）。
 *
 * @see https://www.electron.build/configuration/configuration
 *
 * 这里取代了旧方案里的 `electron-builder.json5` + `scripts/electron-builder.mjs`：
 * 原先需要一层 Node 包装脚本去设置镜像、签名开关、macOS 图标预检，现在这些
 * 都在配置加载时完成（electron-builder 会在开始打包前先加载本文件）。
 */

// 支持通过 .env 提供打包相关变量（如签名 / 公证凭据）
dotenv.config();

/** 项目根目录：npm 脚本会在根目录调用 electron-builder */
const projectDir = process.cwd();

// 国内镜像。package.json#config 里同名配置用于 npm install 阶段的 Electron 下载，
// 这里同步到环境变量，供 electron-builder 下载 Electron / 打包工具链时使用。
try {
    const pkg = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8')) as {
        config?: Record<string, string>;
    };
    if (pkg.config) {
        process.env.ELECTRON_MIRROR ||= pkg.config.electron_mirror;
        process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||= pkg.config.electron_builder_binaries_mirror;
    }
} catch {
    // 读不到 package.json 时忽略，使用默认源
}

// 本地打包默认不做代码签名（需要签名时在 .env 或环境变量里显式开启）
process.env.CSC_IDENTITY_AUTO_DISCOVERY ||= 'false';

/**
 * 仅 macOS：确保 logo.png 带 5% padding，且 iconset / logo.icns 已生成。
 * 对应脚本：scripts/ensureMacOSIcon.py
 */
function ensureMacOSIcon(): void {
    const python = process.platform === 'win32' ? 'python' : 'python3';
    const logoPng = join(projectDir, 'public', 'logo.png');
    const pyScript = join(projectDir, 'scripts', 'ensureMacOSIcon.py');

    // 先做轻量检测（python 内部判断 padding + icns 是否齐全），退出码 0 表示无需处理
    const check = spawnSync(python, [pyScript, '--check'], { stdio: 'inherit' });
    if (check.status === 0) {
        return;
    }

    if (!existsSync(logoPng)) {
        throw new Error(`[electron-builder] 缺少 ${logoPng}，无法继续`);
    }

    const fix = spawnSync(python, [pyScript], { stdio: 'inherit' });
    if (fix.status !== 0) {
        throw new Error('[electron-builder] ensureMacOSIcon 失败，中止打包');
    }
}

if (process.platform === 'darwin') {
    ensureMacOSIcon();
}

const config: Configuration = {
    appId: 'com.aliOSSBrowser',
    asar: true,
    productName: 'Ali OSS Browser',
    directories: {
        output: 'release/${version}',
    },
    // 渲染进程产物 + 主进程/预加载产物；
    // 生产依赖（dependencies）由 electron-builder 自动收集进 asar。
    files: ['dist', 'dist-electron'],
    afterPack: 'scripts/after-pack.mjs',
    mac: {
        target: ['dmg'],
        artifactName: '${productName}-Mac-${version}-Installer.${ext}',
        icon: 'public/logo.icns',
    },
    win: {
        target: [
            {
                target: 'nsis',
                arch: ['x64'],
            },
        ],
        artifactName: '${productName}-Windows-${version}-Setup.${ext}',
        icon: 'public/logo.ico',
        // 图标/版本信息由 scripts/after-pack.mjs 用 rcedit 写入
        signAndEditExecutable: false,
    },
    nsis: {
        oneClick: false,
        perMachine: false,
        allowToChangeInstallationDirectory: true,
        deleteAppDataOnUninstall: false,
    },
    linux: {
        target: ['AppImage'],
        artifactName: '${productName}-Linux-${version}.${ext}',
    },
};

export default config;
