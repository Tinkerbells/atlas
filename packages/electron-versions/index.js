import {execSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveElectronBinary() {
  for (const basePath of [
    join(__dirname, '..', '..', 'package.json'),
    join(process.cwd(), 'package.json'),
  ]) {
    try {
      const req = createRequire(basePath);
      const bin = req('electron');
      if (typeof bin === 'string') return bin;
    } catch {}
  }
  return null;
}

function getElectronEnv() {
  const electronBin = resolveElectronBinary();
  if (!electronBin) return null;

  try {
    return JSON.parse(execSync(
      `"${electronBin}" -p "JSON.stringify(process.versions)"`,
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: 1,
        },
      },
    ));
  } catch {
    return null;
  }
}

function createElectronEnvLoader() {
  let inMemoryCache = null;

  return () => {
    if (inMemoryCache) {
      return inMemoryCache;
    }

    return inMemoryCache = getElectronEnv();
  };
}

const envLoader = createElectronEnvLoader();


export function getElectronVersions() {
  return envLoader();
}

export function getChromeVersion() {
  return getElectronVersions()?.chrome ?? '130.0.0';
}

export function getChromeMajorVersion() {
  return getMajorVersion(getChromeVersion());
}

export function getNodeVersion() {
  return getElectronVersions()?.node ?? '22.0.0';
}

export function getNodeMajorVersion() {
  return getMajorVersion(getNodeVersion());
}

function getMajorVersion(version) {
  return parseInt(version.split('.')[0]);
}
