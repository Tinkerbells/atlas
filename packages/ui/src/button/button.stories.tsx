import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'

import { Button, ButtonGroup } from './button'

const variants = ['filled', 'tonal', 'outlined', 'text', 'elevated'] as const
const sizes = ['sm', 'md', 'lg'] as const

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
      description: 'Material 3 variant.',
    },
    size: {
      control: 'select',
      options: sizes,
      description: 'Component sizing token.',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Stretches button to container width.',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loader and disables interactions.',
    },
    loadingText: {
      control: 'text',
      description: 'Optional loading text; defaults to children.',
    },
    spinnerPlacement: {
      control: 'radio',
      options: ['start', 'end'],
    },
    spinner: { control: false },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
  args: {
    children: 'Label',
    variant: 'filled',
    size: 'md',
    fullWidth: false,
    loading: false,
    loadingText: 'Loading',
    spinnerPlacement: 'start',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** Base control surface with adjustable args. */
export const Base: Story = {
  render: (args: Story['args']) => <Button {...args} />,
}

/** Key Material variants. */
export const Variants: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={variants}>
        {variant => (
          <Button {...args} variant={variant} children={variant} />
        )}
      </For>
    </div>
  ),
}

/** Size tokens for touch targets. */
export const Sizes: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={sizes}>
        {size => (
          <Button {...args} size={size} children={`${size.toUpperCase()} size`} />
        )}
      </For>
    </div>
  ),
}

/** Disabled state for each variant. */
export const Disabled: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '8px' }}>
      <For each={variants}>
        {variant => (
          <Button {...args} disabled variant={variant} children={`${variant} disabled`} />
        )}
      </For>
    </div>
  ),
}

/** Loading spinner with text and spinner placement. */
export const Loading: Story = {
  args: {
    loading: true,
    loadingText: 'Loading...',
  },
  render: (args: Story['args']) => (
    <div style={{ 'display': 'flex', 'gap': '12px', 'align-items': 'center' }}>
      <Button {...args} />
      <Button {...args} spinnerPlacement="end">
        Trailing spinner
      </Button>
    </div>
  ),
}

/** Leading and trailing icon placements. */
export const WithIcons: Story = {
  render: (args: Story['args']) => (
    <div style={{ 'display': 'flex', 'gap': '12px', 'align-items': 'center' }}>
      <Button
        {...args}
        leadingIcon={<span aria-hidden="true">★</span>}
      >
        Leading icon
      </Button>
      <Button
        {...args}
        trailingIcon={<span aria-hidden="true">→</span>}
        variant="tonal"
      >
        Trailing icon
      </Button>
    </div>
  ),
}

/** Horizontal and vertical group alignment. */
export const Grouped: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '16px', width: '320px' }}>
      <ButtonGroup>
        <Button {...args}>Left</Button>
        <Button {...args}>Center</Button>
        <Button {...args}>Right</Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" fullWidth>
        <Button {...args} fullWidth>
          One
        </Button>
        <Button {...args} fullWidth>
          Two
        </Button>
        <Button {...args} fullWidth>
          Three
        </Button>
      </ButtonGroup>
    </div>
  ),
}

/** Full visual matrix for snapshotting. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={variants}>
        {variant => (
          <div style={{ 'display': 'flex', 'gap': '8px', 'align-items': 'center' }}>
            <div style={{ 'width': '92px', 'text-transform': 'capitalize' }}>{variant}</div>
            <For each={sizes}>
              {size => (
                <Button variant={variant} size={size}>
                  {size}
                </Button>
              )}
            </For>
            <Button variant={variant} size="md" loading loadingText="Load" />
            <Button variant={variant} size="md" disabled>
              Disabled
            </Button>
          </div>
        )}
      </For>
    </div>
  ),
}
