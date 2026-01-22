import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Textarea } from './textarea'

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['outlined', 'outlined-rounded', 'filled'],
    },
    invalid: {
      control: 'boolean',
    },
  },
  args: {
    size: 'md',
    variant: 'filled',
    placeholder: 'Share a little more detail…',
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px', width: '420px' }}>
      <Textarea {...args} />
      <Textarea {...args} invalid placeholder="Something went wrong" />
      <Textarea {...args} disabled placeholder="Disabled state" />
    </div>
  ),
}

export const Sizes: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px', width: '420px' }}>
      <Textarea {...args} size="sm" placeholder="Small textarea" />
      <Textarea {...args} size="md" placeholder="Medium textarea" />
      <Textarea {...args} size="lg" placeholder="Large textarea" />
    </div>
  ),
}

export const Variants: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '12px', width: '420px' }}>
      <Textarea {...args} variant="outlined" placeholder="Outlined textarea" />
      <Textarea {...args} variant="outlined-rounded" placeholder="Outlined rounded textarea" />
      <Textarea {...args} variant="filled" placeholder="Filled textarea" />
    </div>
  ),
}
