import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Dialog } from './dialog'
import { Button } from '../button'

const meta = {
  title: 'Components/Dialog',
  component: Dialog.Root,
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Invite teammates</Dialog.Title>
          <Dialog.Description>
            Share access to this project with your team. You can revoke permissions at any time.
          </Dialog.Description>
          <div style={{ 'display': 'flex', 'gap': '10px', 'justify-content': 'flex-end' }}>
            <Button type="button">Cancel</Button>
            <Button type="button">Send invite</Button>
          </div>
          <Dialog.CloseTrigger aria-label="Close dialog">✕</Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
}

export const DefaultOpen: Story = {
  render: () => (
    <Dialog.Root defaultOpen>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Inline dialog</Dialog.Title>
          <Dialog.Description>
            Use
            {' '}
            <code>defaultOpen</code>
            {' '}
            when you want to show the dialog immediately in a flow.
          </Dialog.Description>
          <Dialog.CloseTrigger aria-label="Close dialog">✕</Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
}
