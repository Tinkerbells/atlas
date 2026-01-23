import { createJSXDecorator } from 'storybook-solidjs-vite'

import Themes from '../../src/themes'
import { StyleProvider } from '../../src/style-provider'

export const withTheme = createJSXDecorator((Story, context) => {
  const theme = context.globals.theme || 'light'

  return (
    <StyleProvider theme={() => (theme === 'dark' ? Themes.md3Dark : Themes.md3Light)}>
      <Story />
    </StyleProvider>
  )
})
