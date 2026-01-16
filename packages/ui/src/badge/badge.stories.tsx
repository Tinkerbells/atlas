import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'

import { Badge } from './badge'

const variants = ['surface', 'primary', 'secondary', 'tertiary', 'error'] as const
const sizes = ['sm', 'md', 'lg'] as const

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
      description: 'Color role for the badge container.',
    },
    size: {
      control: 'select',
      options: sizes,
      description: 'Size token aligning with touch density.',
    },
    dot: {
      control: 'boolean',
      description: 'Render badge as a small dot indicator.',
    },
  },
  args: {
    children: 'Label',
    variant: 'surface',
    size: 'md',
    dot: false,
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

/** Base badge with adjustable props. */
export const Base: Story = {
  render: (args: Story['args']) => <Badge {...args} />,
}

/** Material color roles. */
export const Variants: Story = {
  render: (args: Story['args']) => (
    <div style={{ 'display': 'flex', 'gap': '10px', 'align-items': 'center', 'flex-wrap': 'wrap' }}>
      <For each={variants}>
        {variant => (
          <Badge {...args} variant={variant}>
            {variant}
          </Badge>
        )}
      </For>
    </div>
  ),
}

/** Size scales for density. */
export const Sizes: Story = {
  render: (args: Story['args']) => (
    <div style={{ 'display': 'flex', 'gap': '10px', 'align-items': 'center' }}>
      <For each={sizes}>
        {size => (
          <Badge {...args} size={size}>
            {size.toUpperCase()}
          </Badge>
        )}
      </For>
    </div>
  ),
}

/** Dot indicators for unread counts. */
export const Dot: Story = {
  args: {
    dot: true,
    children: '',
  },
  render: (args: Story['args']) => (
    <div style={{ 'display': 'flex', 'gap': '14px', 'align-items': 'center' }}>
      <For each={variants}>
        {variant => (
          <Badge {...args} variant={variant} aria-label={`${variant} dot`} />
        )}
      </For>
    </div>
  ),
}

/** Gallery with all combinations. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={variants}>
        {variant => (
          <div style={{ 'display': 'flex', 'gap': '8px', 'align-items': 'center' }}>
            <div style={{ 'width': '88px', 'text-transform': 'capitalize' }}>{variant}</div>
            <For each={sizes}>
              {size => (
                <Badge variant={variant} size={size}>
                  {size}
                </Badge>
              )}
            </For>
            <Badge variant={variant} size="md" dot aria-label={`${variant} dot`} />
          </div>
        )}
      </For>
    </div>
  ),
}
