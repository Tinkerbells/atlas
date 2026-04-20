import pkg from './package.json' with {type: 'json'};
import mapWorkspaces from '@npmcli/map-workspaces';
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
  linux: {
    target: ['deb'],
  },
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  files: [
    'LICENSE*',
    pkg.main,
    '!node_modules/@atlas/electron-versions/**',
    '!node_modules/@atlas/ui/**',
    ...await getListOfFilesFromEachWorkspace(),
  ],
});

async function getListOfFilesFromEachWorkspace() {
  const electronPackages = [
    '@atlas/electron-main',
    '@atlas/electron-preload',
    '@atlas/vue-desktop',
  ];

  const workspaces = await mapWorkspaces({
    cwd: process.cwd(),
    pkg,
  });

  const allFilesToInclude = [];

  for (const [name, wsPath] of workspaces) {
    if (!electronPackages.includes(name)) {
      continue;
    }

    const pkgPath = join(wsPath, 'package.json');
    const {default: workspacePkg} = await import(pathToFileURL(pkgPath), {with: {type: 'json'}});

    let patterns = workspacePkg.files || ['dist/**', 'package.json'];

    patterns = patterns.map(p => join('node_modules', name, p));
    allFilesToInclude.push(...patterns);
  }

  return allFilesToInclude;
}
