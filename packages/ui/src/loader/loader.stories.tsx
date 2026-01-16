import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Loader } from './loader'

const meta = {
  title: 'Components/Loader',
  component: Loader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    spinnerPlacement: {
      control: 'radio',
      options: ['start', 'end'],
    },
    visible: {
      control: 'boolean',
    },
    spinner: { control: false },
    text: { control: 'text' },
  },
  args: {
    text: 'Loading',
    spinnerPlacement: 'start',
    visible: true,
  },
} satisfies Meta<typeof Loader>

export default meta
type Story = StoryObj<typeof meta>

/** Default loader with text and spinner. */
export const Base: Story = {
  render: (args: Story['args']) => <Loader {...args} />,
}

/** Loader that hides its spinner but preserves children when invisible. */
export const Hidden: Story = {
  args: {
    visible: false,
    text: undefined,
  },
  render: (args: Story['args']) => (
    <Loader {...args}>
      <button style={{ padding: '12px 16px' }}>Child content</button>
    </Loader>
  ),
}

/** Showcase of spinner placement and overlay usage. */
export const Placements: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <Loader text="Start (default)" />
      <Loader text="End aligned" spinnerPlacement="end" />
      <Loader spinner={<span style={{ 'width': '18px', 'height': '18px', 'border': '2px solid currentColor', 'border-radius': '9999px' }} />}>
        Inline child keeps size while spinner overlays
      </Loader>
    </div>
  ),
}

/** All variants together to validate sizing and spacing. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px', width: '360px' }}>
      <Loader text="Primary" />
      <Loader text="Dense end" spinnerPlacement="end" />
      <Loader text="Custom color" style={{ color: 'var(--md-sys-color-tertiary, rebeccapurple)' }} />
      <Loader spinner={<span style={{ 'width': '20px', 'height': '20px', 'border': '3px dotted currentColor', 'border-radius': '50%' }} />}>
        Overlay spinner
      </Loader>
    </div>
  ),
}
