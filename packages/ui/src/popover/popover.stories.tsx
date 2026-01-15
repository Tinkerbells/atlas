import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Popover } from './popover'

const meta = {
  title: 'Components/Popover',
  component: Popover.Root,
  tags: ['autodocs'],
} satisfies Meta<typeof Popover.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--popover-border)', background: '#fff', cursor: 'pointer' }}>
        Show popover
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content>
          <Popover.Title>Engagement</Popover.Title>
          <Popover.Description>
            Popovers are great for supplementary context and confirmations.
          </Popover.Description>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Popover.CloseTrigger aria-label="Close popover">Close</Popover.CloseTrigger>
          </div>
          <Popover.Arrow />
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  ),
}

export const WithActions: Story = {
  render: () => (
    <Popover.Root defaultOpen>
      <Popover.Positioner>
        <Popover.Content>
          <Popover.Title>Save layout?</Popover.Title>
          <Popover.Description>
            Keep these dashboard filters for next time.
          </Popover.Description>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Popover.CloseTrigger>Maybe later</Popover.CloseTrigger>
            <button type="button">Save</button>
          </div>
          <Popover.Arrow />
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  ),
}
