import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Card } from './card'

const meta = {
  title: 'Components/Card',
  component: Card.Root,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'outline'],
    },
  },
  args: {
    variant: 'elevated',
  },
} satisfies Meta<typeof Card.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '14px', width: '420px' }}>
      <Card.Root {...args} variant="elevated">
        <Card.Header>
          <Card.Title>Elevated</Card.Title>
          <Card.Description>Default card with depth.</Card.Description>
        </Card.Header>
        <Card.Body>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vitae tincidunt
          ipsum.
        </Card.Body>
        <Card.Footer>
          <span>Secondary text</span>
          <button type="button">Action</button>
        </Card.Footer>
      </Card.Root>

      <Card.Root {...args} variant="outline">
        <Card.Header>
          <Card.Title>Outline</Card.Title>
          <Card.Description>Minimal card without shadow.</Card.Description>
        </Card.Header>
        <Card.Body>
          You can use this for lists, settings, or any container content.
        </Card.Body>
      </Card.Root>
    </div>
  ),
}
