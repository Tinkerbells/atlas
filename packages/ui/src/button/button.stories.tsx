import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Button } from './button'

const meta = {
  title: 'Components/Button',
  component: Button,
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
    size: 'md',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '12px', width: '360px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button {...args} variant="solid">
          Solid
        </Button>
        <Button {...args} variant="outline">
          Outline
        </Button>
        <Button {...args} variant="ghost">
          Ghost
        </Button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button {...args} variant="solid" disabled>
          Disabled
        </Button>
        <Button {...args} variant="outline" disabled>
          Outline disabled
        </Button>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}
