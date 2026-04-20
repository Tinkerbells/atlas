import {execSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

let electronPath;
try {
  electronPath = require.resolve('electron');
} catch {
  console.error('Electron package not found. Run `pnpm install` first.');
  process.exit(1);
}

const electronDir = path.dirname(electronPath);
const binaryPath = path.join(electronDir, 'dist', 'ELECTRON_RUN_AS_NODE' ? '' : '');

try {
  const electronBin = require('electron');
  if (typeof electronBin === 'string' && existsSync(electronBin)) {
    process.exit(0);
  }
} catch {}

console.log('Downloading Electron binary...');
try {
  execSync('node install.js', {cwd: electronDir, stdio: 'inherit'});
  console.log('Electron binary installed.');
} catch {
  console.error('Failed to install Electron binary.');
  process.exit(1);
}
