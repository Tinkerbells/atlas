import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'

import { RadioGroup } from './radio-group'

const sizes = ['sm', 'md', 'lg'] as const
const frameworks: ReadonlyArray<{ value: string, label: string, disabled?: boolean }> = [
  { value: 'solid', label: 'Solid' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue', disabled: true },
]

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
      description: 'Icon, spacing, and touch-target sizing token.',
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Visual flow for the list; matches keyboard orientation.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables every radio in the group.',
    },
    required: {
      control: 'boolean',
      description: 'Marks the group as required for form validation.',
    },
    name: {
      control: 'text',
      description: 'Native radio name used when posting form data.',
    },
    defaultValue: {
      control: 'text',
      description: 'Initial selection for uncontrolled usage.',
    },
  },
  args: {
    size: 'md',
    orientation: 'vertical',
    name: 'framework',
    defaultValue: 'solid',
    disabled: false,
    required: false,
  },
} satisfies Meta<typeof RadioGroup.Root>

export default meta
type Story = StoryObj<typeof meta>

/** Default Material 3 radio group with a label and mixed availability. */
export const Base: Story = {
  render: (args: Story['args']) => (
    <RadioGroup.Root {...args}>
      <RadioGroup.Label>Framework</RadioGroup.Label>
      <For each={frameworks}>
        {option => (
          <RadioGroup.Item value={option.value} disabled={option.disabled}>
            <RadioGroup.ItemControl>
              <RadioGroup.Indicator />
            </RadioGroup.ItemControl>
            <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
            <RadioGroup.ItemHiddenInput />
          </RadioGroup.Item>
        )}
      </For>
    </RadioGroup.Root>
  ),
}

/** Horizontal layout while keeping the 48px touch targets. */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args: Story['args']) => (
    <RadioGroup.Root {...args}>
      <RadioGroup.Label>Horizontal</RadioGroup.Label>
      <For each={frameworks}>
        {option => (
          <RadioGroup.Item value={option.value} disabled={option.disabled}>
            <RadioGroup.ItemControl>
              <RadioGroup.Indicator />
            </RadioGroup.ItemControl>
            <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
            <RadioGroup.ItemHiddenInput />
          </RadioGroup.Item>
        )}
      </For>
    </RadioGroup.Root>
  ),
}

/** Disabled radios at both group and item level. */
export const Disabled: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '16px', width: '360px' }}>
      <RadioGroup.Root {...args} disabled defaultValue="react">
        <RadioGroup.Label>Group disabled</RadioGroup.Label>
        <For each={frameworks}>
          {option => (
            <RadioGroup.Item value={option.value}>
              <RadioGroup.ItemControl>
                <RadioGroup.Indicator />
              </RadioGroup.ItemControl>
              <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
              <RadioGroup.ItemHiddenInput />
            </RadioGroup.Item>
          )}
        </For>
      </RadioGroup.Root>
      <RadioGroup.Root {...args} defaultValue="vue">
        <RadioGroup.Label>Mixed disabled items</RadioGroup.Label>
        <For each={frameworks}>
          {option => (
            <RadioGroup.Item value={option.value} disabled={option.disabled}>
              <RadioGroup.ItemControl>
                <RadioGroup.Indicator />
              </RadioGroup.ItemControl>
              <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
              <RadioGroup.ItemHiddenInput />
            </RadioGroup.Item>
          )}
        </For>
      </RadioGroup.Root>
    </div>
  ),
}

/** Size tokens mapped to icon and state-layer geometry. */
export const Sizes: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px', width: '360px' }}>
      <For each={sizes}>
        {size => (
          <RadioGroup.Root {...args} size={size} defaultValue="solid">
            <RadioGroup.Label>
              {size.toUpperCase()}
              {' '}
              size
            </RadioGroup.Label>
            <For each={frameworks}>
              {option => (
                <RadioGroup.Item value={option.value} disabled={option.disabled}>
                  <RadioGroup.ItemControl>
                    <RadioGroup.Indicator />
                  </RadioGroup.ItemControl>
                  <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
                  <RadioGroup.ItemHiddenInput />
                </RadioGroup.Item>
              )}
            </For>
          </RadioGroup.Root>
        )}
      </For>
    </div>
  ),
}

/** Snapshot of checked, unchecked, and disabled variants across sizes. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '14px' }}>
      <For each={sizes}>
        {size => (
          <div style={{ 'border': '1px solid var(--md-sys-color-outline, #79747e)', 'padding': '12px', 'border-radius': '12px', 'display': 'grid', 'gap': '10px' }}>
            <strong style={{ 'text-transform': 'uppercase', 'font-size': '12px', 'letter-spacing': '0.05em' }}>
              {size}
              {' '}
              radios
            </strong>
            <RadioGroup.Root size={size} defaultValue="checked" orientation="horizontal" name={`gallery-${size}`}>
              <RadioGroup.Item value="checked">
                <RadioGroup.ItemControl>
                  <RadioGroup.Indicator />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemText>Checked</RadioGroup.ItemText>
                <RadioGroup.ItemHiddenInput />
              </RadioGroup.Item>
              <RadioGroup.Item value="unchecked">
                <RadioGroup.ItemControl>
                  <RadioGroup.Indicator />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemText>Default</RadioGroup.ItemText>
                <RadioGroup.ItemHiddenInput />
              </RadioGroup.Item>
              <RadioGroup.Item value="disabled" disabled>
                <RadioGroup.ItemControl>
                  <RadioGroup.Indicator />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemText>Disabled</RadioGroup.ItemText>
                <RadioGroup.ItemHiddenInput />
              </RadioGroup.Item>
              <RadioGroup.Item value="disabled-checked" disabled>
                <RadioGroup.ItemControl>
                  <RadioGroup.Indicator />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemText>Disabled + checked</RadioGroup.ItemText>
                <RadioGroup.ItemHiddenInput />
              </RadioGroup.Item>
            </RadioGroup.Root>
          </div>
        )}
      </For>
    </div>
  ),
}
