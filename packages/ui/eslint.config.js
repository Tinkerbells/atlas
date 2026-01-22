import { defineConfig } from '@atlas/eslint'

export default defineConfig({
  ignores: [
    'components/**',
    'varlet/**',
    'park-ui/**',
  ],
  formatters: true,
  unocss: true,
  solid: true,
})
