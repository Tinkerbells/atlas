import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '~': './src/app',
    },
  },
  test: {
    include: ['src/app/**/*.spec.ts'],
    environment: 'jsdom',
  },
});
