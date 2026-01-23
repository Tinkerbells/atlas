import type {
  DocsContainerProps,
} from '@storybook/addon-docs/blocks'

import {
  DocsContainer as BaseContainer,
} from '@storybook/addon-docs/blocks'

import { themes } from '../themes'

export function DocsContainerWithTheme(props: React.PropsWithChildren<DocsContainerProps>) {
  return (
    <BaseContainer
      theme={themes[theme === 'dark' ? 'dark' : 'light']}
      context={props.context}
    >
      <StyleProvider theme={() => Themes.md3Light}>
        {props.children}
      </StyleProvider>
    </BaseContainer>
  )
}
