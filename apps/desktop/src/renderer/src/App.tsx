import type { Component } from 'solid-js'

import { For } from 'solid-js'
import { XIcon } from 'lucide-solid'
import { Portal } from 'solid-js/web'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  createListCollection,
  Dialog,
  IconButton,
  Input,
  Menu,
  Popover,
  RadioGroup,
  ScrollArea,
  Select,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
} from '@atlas/ui'

const App: Component = () => {
  const frameworkCollection = createListCollection({
    items: [
      { label: 'Solid', value: 'solid' },
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
    ],
  })

  return (
    <>
      <ScrollArea.Root style={{ height: '100vh' }}>
        <ScrollArea.Viewport style={{ height: '100%' }}>
          <ScrollArea.Content>
            <div
              style={{
                'padding': '32px',
                'display': 'grid',
                'gap': '24px',
                'max-width': '900px',
                'margin': '0 auto',
              }}
            >
              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Buttons</h2>
                <div style={{ 'display': 'flex', 'gap': '12px', 'flex-wrap': 'wrap' }}>
                  <Button>Primary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                  <IconButton aria-label="Settings">
                    <XIcon />
                  </IconButton>
                </div>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Badges & Alerts</h2>
                <div style={{ 'display': 'flex', 'gap': '8px', 'flex-wrap': 'wrap' }}>
                  <Badge>New</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                </div>
                <Alert.Root>
                  <Alert.Title>Heads up</Alert.Title>
                  <Alert.Description>
                    This alert uses the shared UI theme tokens.
                  </Alert.Description>
                </Alert.Root>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Inputs</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <Input placeholder="Type something..." />
                  <Input placeholder="Invalid input" invalid />
                  <Textarea placeholder="Tell us more..." />
                </div>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Selections</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <Checkbox.Root>
                    <Checkbox.Control>
                      <Checkbox.Indicator>
                        <XIcon />
                      </Checkbox.Indicator>
                    </Checkbox.Control>
                    <Checkbox.HiddenInput />
                    <Checkbox.Label>Remember me</Checkbox.Label>
                  </Checkbox.Root>

                  <Switch.Root>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Switch.HiddenInput />
                    <Switch.Label>Enable notifications</Switch.Label>
                  </Switch.Root>

                  <RadioGroup.Root defaultValue="one">
                    <RadioGroup.Label>Priority</RadioGroup.Label>
                    <RadioGroup.Item value="one">
                      <RadioGroup.ItemControl>
                        <RadioGroup.Indicator />
                      </RadioGroup.ItemControl>
                      <RadioGroup.ItemText>Normal</RadioGroup.ItemText>
                      <RadioGroup.ItemHiddenInput />
                    </RadioGroup.Item>
                    <RadioGroup.Item value="two">
                      <RadioGroup.ItemControl>
                        <RadioGroup.Indicator />
                      </RadioGroup.ItemControl>
                      <RadioGroup.ItemText>High</RadioGroup.ItemText>
                      <RadioGroup.ItemHiddenInput />
                    </RadioGroup.Item>
                  </RadioGroup.Root>

                  <Select.Root collection={frameworkCollection}>
                    <Select.Label>Framework</Select.Label>
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Choose..." />
                        <Select.Indicator>v</Select.Indicator>
                      </Select.Trigger>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          <Select.List>
                            <For each={frameworkCollection.items}>
                              {item => (
                                <Select.Item item={item}>
                                  <Select.ItemText>{item.label}</Select.ItemText>
                                  <Select.ItemIndicator>ok</Select.ItemIndicator>
                                </Select.Item>
                              )}
                            </For>
                          </Select.List>
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </div>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Cards & Avatars</h2>
                <Card.Root>
                  <Card.Header>
                    <Card.Title>Workspace</Card.Title>
                    <Card.Description>Quick status overview</Card.Description>
                  </Card.Header>
                  <Card.Body>
                    Active sessions are healthy. No incidents reported.
                  </Card.Body>
                  <Card.Footer>
                    <Avatar.Root>
                      <Avatar.Fallback>AJ</Avatar.Fallback>
                    </Avatar.Root>
                    <Button size="sm">View</Button>
                  </Card.Footer>
                </Card.Root>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Tabs</h2>
                <Tabs.Root defaultValue="overview">
                  <Tabs.List>
                    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                    <Tabs.Trigger value="details">Details</Tabs.Trigger>
                    <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="overview">Overview content</Tabs.Content>
                  <Tabs.Content value="details">Detailed metrics</Tabs.Content>
                  <Tabs.Content value="notes">Notes and next steps</Tabs.Content>
                </Tabs.Root>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Menu & Popover</h2>
                <div style={{ 'display': 'flex', 'gap': '12px', 'flex-wrap': 'wrap' }}>
                  <Menu.Root>
                    <Menu.Trigger
                      asChild={props => <Button {...props} variant="outline" />}
                    >
                      Open Menu
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item value="profile">
                            <Menu.ItemText>Profile</Menu.ItemText>
                          </Menu.Item>
                          <Menu.Item value="settings">
                            <Menu.ItemText>Settings</Menu.ItemText>
                          </Menu.Item>
                          <Menu.Separator />
                          <Menu.Item value="signout">
                            <Menu.ItemText>Sign out</Menu.ItemText>
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>

                  <Popover.Root>
                    <Popover.Trigger
                      asChild={props => <Button {...props} variant="outline" />}
                    >
                      Open Popover
                    </Popover.Trigger>
                    <Portal>
                      <Popover.Positioner>
                        <Popover.Content>
                          <Popover.Title>Quick actions</Popover.Title>
                          <Popover.Description>
                            Assign or snooze without leaving this view.
                          </Popover.Description>
                        </Popover.Content>
                      </Popover.Positioner>
                    </Portal>
                  </Popover.Root>
                </div>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Tooltip</h2>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    asChild={props => (
                      <IconButton {...props} aria-label="Tooltip target" />
                    )}
                  >
                    <XIcon />
                  </Tooltip.Trigger>
                  <Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Content>Close panel</Tooltip.Content>
                    </Tooltip.Positioner>
                  </Portal>
                </Tooltip.Root>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>ScrollArea</h2>
                <ScrollArea.Root style={{ height: '180px' }}>
                  <ScrollArea.Viewport style={{ height: '100%' }}>
                    <ScrollArea.Content style={{ padding: '16px' }}>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu
                        fugiat nulla pariatur.
                      </p>
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar>
                    <ScrollArea.Thumb />
                  </ScrollArea.Scrollbar>
                  <ScrollArea.Corner />
                </ScrollArea.Root>
              </section>

              <section style={{ display: 'grid', gap: '12px' }}>
                <h2>Dialog</h2>
                <Dialog.Root>
                  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                  <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                      <Dialog.Content>
                        <Dialog.Title>Dialog Title</Dialog.Title>
                        <Dialog.Description>
                          Dialog Description with consistent styling.
                        </Dialog.Description>
                        <Dialog.CloseTrigger aria-label="Close dialog">
                          <XIcon />
                        </Dialog.CloseTrigger>
                      </Dialog.Content>
                    </Dialog.Positioner>
                  </Portal>
                </Dialog.Root>
              </section>
            </div>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar>
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </>
  )
}

export default App
