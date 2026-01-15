import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Alert } from './alert'

const meta = {
  title: 'Components/Alert',
  component: Alert.Root,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
    },
  },
  args: {
    variant: 'info',
  },
} satisfies Meta<typeof Alert.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '12px', width: '420px' }}>
      <Alert.Root {...args} variant="info">
        <Alert.Title>Heads up</Alert.Title>
        <Alert.Description>Neutral information for the user.</Alert.Description>
      </Alert.Root>
      <Alert.Root {...args} variant="success">
        <Alert.Title>Saved</Alert.Title>
        <Alert.Description>Your changes were stored successfully.</Alert.Description>
      </Alert.Root>
      <Alert.Root {...args} variant="warning">
        <Alert.Title>Check again</Alert.Title>
        <Alert.Description>There might be a conflict, verify before continuing.</Alert.Description>
      </Alert.Root>
      <Alert.Root {...args} variant="danger">
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>Something went wrong, please retry.</Alert.Description>
      </Alert.Root>
    </div>
  ),
}
