import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineMain } from 'storybook-solidjs-vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineMain({
  framework: {
    name: 'storybook-solidjs-vite',
    options: {},
  },
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-vitest',
  ],
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  viteFinal: async (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@styles': path.resolve(__dirname, '../src/styles'),
        '@': path.resolve(__dirname, '../src'),
      },
    }
    return config
  },
})
