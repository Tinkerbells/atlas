import {initApp} from './dist/index.js';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === 'development' || process.env.PLAYWRIGHT_TEST === 'true' || !!process.env.CI) {
  function showAndExit(...args) {
    console.error(...args);
    process.exit(1);
  }

  process.on('uncaughtException', showAndExit);
  process.on('unhandledRejection', showAndExit);
}

initApp(
  {
    renderer: (process.env.MODE === 'development' && !!process.env.VITE_DEV_SERVER_URL) ?
      new URL(process.env.VITE_DEV_SERVER_URL)
      : {
        path: join(__dirname, '../../apps/vue-desktop/dist/index.html'),
      },

    preload: {
      path: join(__dirname, '../electron-preload/dist/exposed.mjs'),
    },
  },
);
