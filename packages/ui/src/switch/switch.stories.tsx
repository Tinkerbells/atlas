import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Switch } from './switch'

const meta = {
  title: 'Components/Switch',
  component: Switch.Root,
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
} satisfies Meta<typeof Switch.Root>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px', width: '320px' }}>
      <Switch.Root {...args} defaultChecked>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>Enabled by default</Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>

      <Switch.Root {...args}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>Off state</Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>

      <Switch.Root {...args} disabled defaultChecked>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>Disabled</Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: '320px' }}>
      <Switch.Root size="sm" defaultChecked>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>Small</Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>
      <Switch.Root size="md" defaultChecked>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>Medium</Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>
      <Switch.Root size="lg" defaultChecked>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>Large</Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>
    </div>
  ),
}
