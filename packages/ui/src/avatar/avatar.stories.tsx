import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Avatar } from './avatar'

const meta = {
  title: 'Components/Avatar',
  component: Avatar.Root,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    size: 'md',
  },
} satisfies Meta<typeof Avatar.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Sizes: Story = {
  render: args => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Avatar.Root {...args} size="sm">
        <Avatar.Image src="https://i.pravatar.cc/120?img=3" alt="Person" />
        <Avatar.Fallback>SM</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root {...args} size="md">
        <Avatar.Image src="https://i.pravatar.cc/120?img=5" alt="Person" />
        <Avatar.Fallback>MD</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root {...args} size="lg">
        <Avatar.Image src="https://i.pravatar.cc/160?img=7" alt="Person" />
        <Avatar.Fallback>LG</Avatar.Fallback>
      </Avatar.Root>
    </div>
  ),
}

export const Fallbacks: Story = {
  render: args => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Avatar.Root {...args} size="md">
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root {...args} size="md">
        <Avatar.Fallback aria-label="No photo">UX</Avatar.Fallback>
      </Avatar.Root>
    </div>
  ),
}
