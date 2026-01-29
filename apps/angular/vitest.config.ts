import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '~': '/Users/user/projects/atlas/apps/angular/src/app',
    },
  },
  test: {
    include: ['src/app/**/*.spec.ts'],
    environment: 'jsdom',
  },
});
