import { defineConfig } from '@atlas/eslint'

export default defineConfig({
  ignores: [
    'components/**',
    'park-ui/**',
    'beercss/**',
    'mdui/**',
  ],
  formatters: true,
  unocss: true,
  solid: true,
})
