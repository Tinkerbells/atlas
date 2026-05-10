import pkg from './package.json' with {type: 'json'};

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
    '!node_modules/@atlas/**',
  ],
});
