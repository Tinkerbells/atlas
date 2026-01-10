import unocss from 'unocss/vite'
import { resolve } from 'node:path'
import solid from 'vite-plugin-solid'
import { defineConfig } from 'electron-vite'

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
