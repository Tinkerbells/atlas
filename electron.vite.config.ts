import unocss from 'unocss/vite'
import { resolve } from 'node:path'
import solid from 'vite-plugin-solid'
import { defineConfig } from 'electron-vite'
// import { analyzer } from 'vite-bundle-analyzer'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [unocss(), solid()],
  },
})
