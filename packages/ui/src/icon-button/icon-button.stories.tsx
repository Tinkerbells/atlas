import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'
import { Check, Heart, MousePointer2, Search, Star, X } from 'lucide-solid'

import { IconButton } from './icon-button'

const variants = ['standard', 'filled', 'tonal', 'outlined'] as const
const sizes = ['sm', 'md', 'lg'] as const

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
      description: 'Material 3 icon button style.',
    },
    size: {
      control: 'select',
      options: sizes,
      description: 'Touch target sizing.',
    },
    selected: {
      control: 'boolean',
      description: 'Marks the control as pressed/selected.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button.',
    },
    children: { control: 'text', description: 'Icon content.' },
  },
  args: {
    'variant': 'standard',
    'size': 'md',
    'selected': false,
    'disabled': false,
    'children': <Star aria-hidden="true" />,
    'aria-label': 'Icon button',
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

/** Base playground for controls. */
export const Base: Story = {
  render: (args: Story['args']) => (
    <IconButton {...args}>
      <Search />
    </IconButton>
  ),
}

/** Variant surfaces across default and selected states. */
export const Variants: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={variants}>
        {variant => (
          <div style={{ 'display': 'flex', 'gap': '12px', 'align-items': 'center' }}>
            <div style={{ 'width': '96px', 'text-transform': 'capitalize' }}>{variant}</div>
            <IconButton {...args} variant={variant} selected={false}>
              <Star aria-hidden="true" />
            </IconButton>
            <IconButton {...args} variant={variant} selected>
              <Heart aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </For>
    </div>
  ),
}

/** Size tokens for minimum touch targets. */
export const Sizes: Story = {
  render: (args: Story['args']) => (
    <div style={{ 'display': 'flex', 'gap': '12px', 'align-items': 'center' }}>
      <For each={sizes}>
        {size => (
          <IconButton {...args} size={size}>
            <MousePointer2 aria-hidden="true" />
          </IconButton>
        )}
      </For>
    </div>
  ),
}

/** Interaction states: selected vs disabled. */
export const States: Story = {
  render: (args: Story['args']) => (
    <div style={{ 'display': 'flex', 'gap': '12px', 'align-items': 'center' }}>
      <IconButton {...args} selected>
        <Check aria-hidden="true" />
      </IconButton>
      <IconButton {...args} disabled>
        <X aria-hidden="true" />
      </IconButton>
    </div>
  ),
}

/** Full matrix for snapshotting. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={variants}>
        {variant => (
          <div style={{ 'display': 'flex', 'gap': '8px', 'align-items': 'center' }}>
            <div style={{ 'width': '96px', 'text-transform': 'capitalize' }}>{variant}</div>
            <For each={sizes}>
              {size => (
                <IconButton variant={variant} size={size}>
                  <Star aria-hidden="true" />
                </IconButton>
              )}
            </For>
            <IconButton variant={variant} size="md" selected>
              <Heart aria-hidden="true" />
            </IconButton>
            <IconButton variant={variant} size="md" disabled>
              <X aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </For>
    </div>
  ),
}
