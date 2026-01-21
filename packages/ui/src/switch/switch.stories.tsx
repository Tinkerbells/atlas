import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'

import { Switch } from './switch'

const sizes = ['sm', 'md', 'lg'] as const

const meta = {
  title: 'Components/Switch',
  component: Switch.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
      description: 'Size token applied to track, thumb, and label.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables interactions and dims the track/label.',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Initial checked state for uncontrolled usage.',
    },
    checked: {
      control: 'boolean',
      description: 'Controlled checked state (pair with onCheckedChange).',
      table: { category: 'Controlled' },
    },
  },
  args: {
    size: 'md',
    disabled: false,
    defaultChecked: false,
  },
} satisfies Meta<typeof Switch.Root>

export default meta
type Story = StoryObj<typeof meta>

/** Playground switch with label and hidden input. */
export const Base: Story = {
  args: {
    defaultChecked: true,
  },
  render: (args: Story['args']) => (
    <Switch.Root {...args}>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Label>Wi‑Fi</Switch.Label>
      <Switch.HiddenInput />
    </Switch.Root>
  ),
}

/** Common on/off/disabled states. */
export const States: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px', width: '320px' }}>
      <Switch.Root {...args} defaultChecked>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>Enabled</Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>

      <Switch.Root {...args} defaultChecked={false}>
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

/** Size tokens to meet 48px touch targets. */
export const Sizes: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={sizes}>
        {size => (
          <Switch.Root {...args} size={size} defaultChecked>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>{size.toUpperCase()}</Switch.Label>
            <Switch.HiddenInput />
          </Switch.Root>
        )}
      </For>
    </div>
  ),
}

/** Snapshot of all sizes in on/off/disabled states. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <For each={sizes}>
        {size => (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ 'text-transform': 'uppercase', 'font-size': '12px', 'color': 'var(--md-sys-color-on-surface-variant, #49454f)' }}>
              {size}
            </div>
            <Switch.Root size={size} defaultChecked>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>On</Switch.Label>
              <Switch.HiddenInput />
            </Switch.Root>
            <Switch.Root size={size} defaultChecked={false}>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Off</Switch.Label>
              <Switch.HiddenInput />
            </Switch.Root>
            <Switch.Root size={size} disabled defaultChecked>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Disabled</Switch.Label>
              <Switch.HiddenInput />
            </Switch.Root>
          </div>
        )}
      </For>
    </div>
  ),
}
