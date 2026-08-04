import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));

if (pkg.config) {
    process.env.ELECTRON_MIRROR ||= pkg.config.electron_mirror;
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||= pkg.config.electron_builder_binaries_mirror;
}

process.env.CSC_IDENTITY_AUTO_DISCOVERY ||= 'false';

const child = spawn('electron-builder', process.argv.slice(2), { stdio: 'inherit', shell: true });

child.on('exit', (code) => process.exit(code ?? 1));
