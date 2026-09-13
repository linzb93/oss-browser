import { spawn } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));

if (pkg.config) {
    process.env.ELECTRON_MIRROR ||= pkg.config.electron_mirror;
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||= pkg.config.electron_builder_binaries_mirror;
}

process.env.CSC_IDENTITY_AUTO_DISCOVERY ||= 'false';

// 仅 macOS:确保 logo.png 带 5% padding,iconset / logo.icns 已生成
if (process.platform === 'darwin') {
    const repoRoot = new URL('..', import.meta.url);
    const logoPng = new URL('public/logo.png', repoRoot);
    const logoIcns = new URL('public/logo.icns', repoRoot);
    const pyScript = new URL('./ensureMacOSIcon.py', import.meta.url);

    const python = process.platform === 'win32' ? 'python' : 'python3';

    // 先做轻量检测(python 内部判断 padding + icns 是否齐全);退出码 0 表示无需处理
    const check = spawnSync(python, [fileURLToPath(pyScript), '--check'], { stdio: 'inherit' });
    if (check.status !== 0) {
        // 缺 logo.png 直接报错
        if (!existsSync(fileURLToPath(logoPng))) {
            console.error(`[electron-builder] 缺少 ${fileURLToPath(logoPng)},无法继续`);
            process.exit(1);
        }
        const fix = spawnSync(python, [fileURLToPath(pyScript)], { stdio: 'inherit' });
        if (fix.status !== 0) {
            console.error('[electron-builder] ensureMacOSIcon 失败,中止打包');
            process.exit(fix.status ?? 1);
        }
    }
}

const child = spawn('electron-builder', process.argv.slice(2), { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 1));