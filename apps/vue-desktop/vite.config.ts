import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@atlas/di': resolve(__dirname, '../../packages/di/src/index.ts'),
      '@atlas/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
})
