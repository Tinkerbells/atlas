import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Checkbox } from './checkbox'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox.Root,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    size: 'md',
  },
} satisfies Meta<typeof Checkbox.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '14px', width: '420px' }}>
      <Checkbox.Root {...args} defaultChecked>
        <Checkbox.Control>
          <Checkbox.Indicator>✓</Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label>Remember me</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>

      <Checkbox.Root {...args}>
        <Checkbox.Control>
          <Checkbox.Indicator>✓</Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label>Unselected state</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>

      <Checkbox.Group>
        <div style={{ fontSize: '13px', color: 'var(--ui-muted)' }}>Notification channels</div>
        <Checkbox.Root {...args} value="email" defaultChecked>
          <Checkbox.Control>
            <Checkbox.Indicator>✓</Checkbox.Indicator>
          </Checkbox.Control>
          <Checkbox.Label>Email</Checkbox.Label>
          <Checkbox.HiddenInput />
        </Checkbox.Root>
        <Checkbox.Root {...args} value="sms">
          <Checkbox.Control>
            <Checkbox.Indicator>✓</Checkbox.Indicator>
          </Checkbox.Control>
          <Checkbox.Label>SMS</Checkbox.Label>
          <Checkbox.HiddenInput />
        </Checkbox.Root>
        <Checkbox.Root {...args} value="push" disabled>
          <Checkbox.Control>
            <Checkbox.Indicator>✓</Checkbox.Indicator>
          </Checkbox.Control>
          <Checkbox.Label>Push (disabled)</Checkbox.Label>
          <Checkbox.HiddenInput />
        </Checkbox.Root>
      </Checkbox.Group>
    </div>
  ),
}
