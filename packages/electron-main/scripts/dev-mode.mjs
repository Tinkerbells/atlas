import {build, createServer} from 'vite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');

const mode = 'development';
process.env.NODE_ENV = mode;
process.env.MODE = mode;

const rendererWatchServer = await createServer({
  mode,
  root: path.resolve(rootDir, 'apps/vue-desktop'),
});

await rendererWatchServer.listen();

const rendererWatchServerProvider = {
  name: '@atlas/renderer-watch-server-provider',
  api: {
    provideRendererWatchServer() {
      return rendererWatchServer;
    },
  },
};

const packagesToStart = [
  'packages/electron-preload',
  'packages/electron-main',
];

for (const pkg of packagesToStart) {
  await build({
    mode,
    root: path.resolve(rootDir, pkg),
    plugins: [
      rendererWatchServerProvider,
    ],
  });
}
