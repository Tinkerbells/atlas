import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'

import { Checkbox } from './checkbox'

const sizes = ['sm', 'md', 'lg'] as const

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
      description: 'Size token for control and label.',
    },
    disabled: {
      control: 'boolean',
    },
  },
  args: {
    size: 'md',
    disabled: false,
  },
} satisfies Meta<typeof Checkbox.Root>

export default meta
type Story = StoryObj<typeof meta>

/** Base playground with states. */
export const Base: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '14px', width: '320px' }}>
      <Checkbox.Root {...args} defaultChecked>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>Checked</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>

      <Checkbox.Root {...args} checked="indeterminate">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>Indeterminate</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>

      <Checkbox.Root {...args}>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>Unchecked</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>

      <Checkbox.Root {...args} disabled defaultChecked>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>Disabled</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
    </div>
  ),
}

/** Size comparison for touch targets. */
export const Sizes: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={sizes}>
        {size => (
          <Checkbox.Root {...args} size={size} defaultChecked>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>{size.toUpperCase()}</Checkbox.Label>
            <Checkbox.HiddenInput />
          </Checkbox.Root>
        )}
      </For>
    </div>
  ),
}

/** Grouped usage for multi-select lists. */
export const Grouped: Story = {
  render: (args: Story['args']) => (
    <Checkbox.Group>
      <div style={{ 'font-size': '13px', 'color': 'var(--md-sys-color-on-surface-variant, #49454f)' }}>
        Notification channels
      </div>
      <Checkbox.Root {...args} value="email" defaultChecked>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>Email</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
      <Checkbox.Root {...args} value="sms">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>SMS</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
      <Checkbox.Root {...args} value="push" disabled>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>Push (disabled)</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
    </Checkbox.Group>
  ),
}

/** Snapshot grid of all sizes and states. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={sizes}>
        {size => (
          <div style={{ 'display': 'grid', 'gap': '8px', 'align-items': 'center' }}>
            <div style={{ 'text-transform': 'uppercase', 'font-size': '12px' }}>{size}</div>
            <Checkbox.Root size={size} defaultChecked>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Checked</Checkbox.Label>
              <Checkbox.HiddenInput />
            </Checkbox.Root>
            <Checkbox.Root size={size} checked="indeterminate">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Indeterminate</Checkbox.Label>
              <Checkbox.HiddenInput />
            </Checkbox.Root>
            <Checkbox.Root size={size} disabled defaultChecked>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Disabled</Checkbox.Label>
              <Checkbox.HiddenInput />
            </Checkbox.Root>
          </div>
        )}
      </For>
    </div>
  ),
}
