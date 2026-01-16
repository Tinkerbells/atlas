import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Menu } from './menu'

const meta = {
  title: 'Components/Menu',
  component: Menu.Root,
  tags: ['autodocs'],
} satisfies Meta<typeof Menu.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger style={{ 'padding': '10px 14px', 'border-radius': '12px', 'border': '1px solid var(--menu-content-border)', 'background': '#fff', 'cursor': 'pointer' }}>
        Open menu
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="profile">
            <Menu.ItemText>Profile</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="settings">
            <Menu.ItemText>Settings</Menu.ItemText>
          </Menu.Item>
          <Menu.Separator />
          <Menu.CheckboxItem value="newsletter" checked>
            <Menu.ItemText>Newsletter</Menu.ItemText>
            <Menu.ItemIndicator>✓</Menu.ItemIndicator>
          </Menu.CheckboxItem>
          <Menu.CheckboxItem value="product-updates" checked={false}>
            <Menu.ItemText>Product updates</Menu.ItemText>
            <Menu.ItemIndicator>✓</Menu.ItemIndicator>
          </Menu.CheckboxItem>
          <Menu.Separator />
          <Menu.ItemGroupLabel>Sort</Menu.ItemGroupLabel>
          <Menu.RadioItemGroup value="asc">
            <Menu.RadioItem value="asc">
              <Menu.ItemText>Ascending</Menu.ItemText>
              <Menu.ItemIndicator>●</Menu.ItemIndicator>
            </Menu.RadioItem>
            <Menu.RadioItem value="desc">
              <Menu.ItemText>Descending</Menu.ItemText>
              <Menu.ItemIndicator>●</Menu.ItemIndicator>
            </Menu.RadioItem>
          </Menu.RadioItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
}
