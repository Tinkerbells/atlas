import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { IconButton } from './icon-button'

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    'size': 'md',
    'variant': 'ghost',
    'aria-label': 'Icon button',
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: args => (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <IconButton {...args} variant="solid">
        ❤️
      </IconButton>
      <IconButton {...args} variant="outline">
        ♡
      </IconButton>
      <IconButton {...args} variant="ghost">
        ★
      </IconButton>
    </div>
  ),
}

export const Sizes: Story = {
  render: args => (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <IconButton {...args} size="sm">
        ↺
      </IconButton>
      <IconButton {...args} size="md">
        ↻
      </IconButton>
      <IconButton {...args} size="lg">
        ↗
      </IconButton>
    </div>
  ),
}
