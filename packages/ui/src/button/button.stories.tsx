import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    outline: {
      control: 'boolean',
    },
    text: {
      control: 'boolean',
    },
    elevation: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 15],
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'info', 'success', 'warning', 'danger', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['normal', 'mini', 'small', 'large'],
    },
    loading: {
      control: 'boolean',
    },
    ripple: {
      control: 'boolean',
    },
    spinnerPlacement: {
      control: 'select',
      options: ['start', 'end'],
    },
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const Base: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'normal',
    ripple: true,
    disabled: false,
    loading: false,
  },
}

/**
 * All button variants by color
 */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: 'fit-content' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="default">Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="info">Info</Button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="default" disabled>
          Default disabled
        </Button>
      </div>
    </div>
  ),
}

/**
 * All button sizes
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ 'display': 'flex', 'gap': '10px', 'align-items': 'center' }}>
      <Button size="mini">Mini</Button>
      <Button size="small">Small</Button>
      <Button size="normal">Normal</Button>
      <Button size="large">Large</Button>
    </div>
  ),
}

/**
 * Buttons in loading state
 */
export const Loading: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: 'fit-content' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button loading>Loading...</Button>
        <Button variant="primary" loading>
          Loading...
        </Button>
        <Button variant="danger" loading>
          Deleting...
        </Button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button loading size="mini">
          Mini
        </Button>
        <Button loading size="small">
          Small
        </Button>
        <Button loading size="large">
          Large
        </Button>
      </div>
    </div>
  ),
}

/**
 * Buttons with ripple effect
 */
export const Ripple: Story = {
  render: () => (
    <div style={{ 'display': 'flex', 'gap': '10px', 'align-items': 'center' }}>
      <Button ripple>Default</Button>
      <Button ripple variant="primary">
        Primary
      </Button>
      <Button ripple variant="success">
        Success
      </Button>
    </div>
  ),
}
