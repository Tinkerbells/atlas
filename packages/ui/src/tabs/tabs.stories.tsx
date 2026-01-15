import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Tabs } from './tabs'

const meta = {
  title: 'Components/Tabs',
  component: Tabs.Root,
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
} satisfies Meta<typeof Tabs.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: args => (
    <Tabs.Root {...args} defaultValue="account">
      <Tabs.List>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
        <Tabs.Trigger value="team">Team</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="account">
        <p style={{ margin: 0 }}>Profile preferences and account information.</p>
      </Tabs.Content>
      <Tabs.Content value="billing">
        <p style={{ margin: 0 }}>Payment methods, invoices, and limits.</p>
      </Tabs.Content>
      <Tabs.Content value="team">
        <p style={{ margin: 0 }}>Invite collaborators and manage roles.</p>
      </Tabs.Content>
    </Tabs.Root>
  ),
}
