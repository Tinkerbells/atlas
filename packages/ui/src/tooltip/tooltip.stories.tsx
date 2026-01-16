import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Tooltip } from './tooltip'

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip.Root,
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Tooltip.Root openDelay={200}>
      <Tooltip.Trigger style={{ 'padding': '10px 14px', 'border-radius': '10px', 'border': '1px solid var(--tooltip-border)', 'background': '#fff', 'cursor': 'pointer' }}>
        Hover me
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>
          Quick hint about this action.
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  ),
}
