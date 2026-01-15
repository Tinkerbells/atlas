import addonA11y from '@storybook/addon-a11y'
import addonDocs from '@storybook/addon-docs'
import { definePreview } from 'storybook-solidjs-vite'

import './preview.css'

if (typeof document !== 'undefined') {
  // Default theme for Storybook; tokens live in css/light.css
  document.documentElement.classList.add('light')
}

export default definePreview({
  addons: [addonDocs(), addonA11y()],
  parameters: {
    actions: {
      argTypesRegex: '^on.*',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    layout: 'centered',
  },
})
