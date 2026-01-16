import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For, splitProps } from 'solid-js'

import type { TabsAlign, TabsPlacement, TabsSize, TabsVariant } from './tabs'

import { Tabs } from './tabs'

const meta = {
  title: 'Components/Tabs',
  component: Tabs.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Controls vertical padding and label type scale.',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Primary uses a 3dp indicator; secondary is toned down with 2dp indicator.',
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Changes layout direction and where the indicator is anchored.',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      description: 'Alignment for tab triggers inside the list.',
    },
  },
  args: {
    size: 'md' as TabsSize,
    variant: 'primary' as TabsVariant,
    placement: 'top' as TabsPlacement,
    align: 'start' as TabsAlign,
  },
} satisfies Meta<typeof Tabs.Root>

export default meta
type Story = StoryObj<typeof meta>

const items = [
  { value: 'account', label: 'Account', copy: 'Profile preferences and account information.' },
  { value: 'billing', label: 'Billing', copy: 'Payment methods, invoices, and limits.' },
  { value: 'team', label: 'Team', copy: 'Invite collaborators and manage roles.' },
]

function DemoTabs(props: Story['args'] & { disabledValue?: string }) {
  const [local, rest] = splitProps(props, ['disabledValue'])

  return (
    <Tabs.Root {...rest} defaultValue="account">
      <Tabs.List>
        <For each={items}>
          {item => (
            <Tabs.Trigger value={item.value} disabled={local.disabledValue === item.value}>
              {item.label}
            </Tabs.Trigger>
          )}
        </For>
        <Tabs.Indicator />
      </Tabs.List>
      <For each={items}>
        {item => (
          <Tabs.Content value={item.value}>
            <p style={{ margin: 0 }}>{item.copy}</p>
          </Tabs.Content>
        )}
      </For>
    </Tabs.Root>
  )
}

/** Default horizontal tabs with a primary indicator and textual labels. */
export const Base: Story = {
  render: (args: Story['args']) => <DemoTabs {...args} />,
}

/** Secondary tone reduces emphasis while keeping the same layout and spacing. */
export const SecondaryVariant: Story = {
  args: {
    variant: 'secondary',
  },
  render: (args: Story['args']) => <DemoTabs {...args} />,
}

/** Vertical placement anchors the indicator along the side and stacks triggers. */
export const VerticalPlacement: Story = {
  args: {
    placement: 'left',
    align: 'start',
  },
  render: (args: Story['args']) => <DemoTabs {...args} />,
}

/** Demonstrates a disabled tab mixed with focus/selection states. */
export const WithDisabled: Story = {
  render: (args: Story['args']) => <DemoTabs {...args} disabledValue="billing" />,
  parameters: {
    docs: {
      description: {
        story:
          'Disabled tabs keep layout spacing and indicator behavior while preventing selection and focus.',
      },
    },
  },
}

/** Quick overview of size and variant combinations in one view. */
export const AllVariants: Story = {
  render: () => {
    const variants: TabsVariant[] = ['primary', 'secondary']
    const sizes: TabsSize[] = ['sm', 'md', 'lg']

    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        <For each={variants}>
          {(variant) => {
            const label = `${variant.charAt(0).toUpperCase() + variant.slice(1)} indicator`
            return (
              <div
                style={{
                  'display': 'grid',
                  'gap': '12px',
                  'border': '1px solid var(--md-sys-color-outline-variant, #cac4d0)',
                  'border-radius': '12px',
                  'padding': '12px',
                  'background': 'var(--md-sys-color-surface, #fef7ff)',
                }}
              >
                <div
                  style={{
                    'font-weight': 600,
                    'color': 'var(--md-sys-color-on-surface, #1d1b20)',
                  }}
                >
                  {label}
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <For each={sizes}>
                    {size => <DemoTabs size={size} variant={variant} placement="top" align="start" />}
                  </For>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    )
  },
}
