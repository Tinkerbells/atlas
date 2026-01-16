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
    border: { control: 'boolean' },
    round: { control: 'boolean' },
    fill: { control: 'boolean' },
    invalid: {
      control: 'boolean',
    },
  },
  args: {
    size: 'md',
    border: true,
    round: false,
    fill: false,
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
      <Textarea {...args} border placeholder="Border textarea" />
      <Textarea
        {...args}
        border={false}
        round
        placeholder="Round textarea"
      />
      <Textarea {...args} border fill placeholder="Fill textarea" />
      <Textarea {...args} border round placeholder="Border + Round textarea" />
      <Textarea
        {...args}
        border
        round
        fill
        placeholder="Combined textarea"
      />
    </div>
  ),
}
