import addonA11y from '@storybook/addon-a11y'
import addonDocs from '@storybook/addon-docs'
import { definePreview } from 'storybook-solidjs-vite'

import './preview.css'
import { withTheme } from './decorators'

export default definePreview({
  decorators: [withTheme],
  addons: [addonDocs(), addonA11y()],
  parameters: {
    actions: {
      argTypesRegex: '^on.*',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      test: 'todo',
    },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Color theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        items: [
          { value: 'light', title: 'Light theme ☀️' },
          { value: 'dark', title: 'Dark theme 🌙' },
        ],
        dynamicTitle: true,
      },
    },
  },
})
