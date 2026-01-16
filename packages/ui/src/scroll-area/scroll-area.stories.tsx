import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'

import { ScrollArea } from './scroll-area'

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea.Root,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <ScrollArea.Root style={{ 'width': '320px', 'height': '180px', 'border': '1px solid var(--card-border)', 'border-radius': '14px', 'overflow': 'hidden' }}>
      <ScrollArea.Viewport>
        <ScrollArea.Content style={{ padding: '12px 14px', display: 'grid', gap: '10px' }}>
          <For each={Array.from({ length: 20 })}>
            {(_, index) => (
              <div style={{ 'padding': '10px', 'border-radius': '10px', 'background': '#f8fafc' }}>
                Line item
                {' '}
                {index() + 1}
              </div>
            )}
          </For>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  ),
}
