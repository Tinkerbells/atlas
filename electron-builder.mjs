import pkg from './package.json' with {type: 'json'};
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

export default /** @type import('electron-builder').Configuration */
({
  appId: 'com.atlas.desktop',
  productName: 'Atlas',
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  generateUpdatesFilesForAllChannels: true,
  mac: {
    target: ['dmg'],
    category: 'public.app-category.utilities',
  },
  win: {
    target: ['nsis'],
  },
  linux: {
    target: ['deb', 'AppImage'],
  },
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  files: [
    'LICENSE*',
    pkg.main,
    '!node_modules/**',
    ...await getListOfFilesFromEachWorkspace(),
  ],
});

async function getListOfFilesFromEachWorkspace() {
  const electronPackages = {
    '@atlas/electron-main': 'packages/electron-main',
    '@atlas/electron-preload': 'packages/electron-preload',
    '@atlas/vue-desktop': 'apps/vue-desktop',
  };

  const allFilesToInclude = [];

  for (const [name, wsPath] of Object.entries(electronPackages)) {
    const pkgPath = join(wsPath, 'package.json');
    const {default: workspacePkg} = await import(pathToFileURL(pkgPath), {with: {type: 'json'}});

    let patterns = workspacePkg.files || ['dist/**', 'package.json'];

    patterns = patterns.map(p => join(wsPath, p));
    allFilesToInclude.push(...patterns);
  }

  return allFilesToInclude;
}
