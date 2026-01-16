import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'

import { Card } from './card'
import { Button } from '../button'

const variants = ['elevated', 'outlined', 'filled'] as const
const spacings = ['compact', 'comfortable', 'expanded'] as const

const meta = {
  title: 'Components/Card',
  component: Card.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
      description: 'Container treatment.',
    },
    spacing: {
      control: 'select',
      options: spacings,
      description: 'Internal padding scale.',
    },
    media: { control: false },
    header: { control: false },
    footer: { control: false },
  },
  args: {
    variant: 'elevated',
    spacing: 'comfortable',
  },
} satisfies Meta<typeof Card.Root>

export default meta
type Story = StoryObj<typeof meta>

const sampleBody = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vitae tincidunt ipsum.'

/** Base card with header, body, and footer slots. */
export const Base: Story = {
  render: (args: Story['args']) => (
    <Card.Root
      {...args}
      header={(
        <Card.Header>
          <Card.Title>Card title</Card.Title>
          <Card.Description>Supporting descriptive copy.</Card.Description>
        </Card.Header>
      )}
      footer={(
        <Card.Footer>
          <span>Secondary text</span>
          <Button variant="text" size="sm">
            Action
          </Button>
        </Card.Footer>
      )}
    >
      <Card.Body>{sampleBody}</Card.Body>
    </Card.Root>
  ),
}

/** Variants for elevated/outlined/filled treatments. */
export const Variants: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '16px', width: '460px' }}>
      <For each={variants}>
        {variant => (
          <Card.Root
            {...args}
            variant={variant}
            header={(
              <Card.Header>
                <Card.Title>{variant}</Card.Title>
                <Card.Description>
                  Material card
                  {variant}
                  {' '}
                  state.
                </Card.Description>
              </Card.Header>
            )}
            footer={(
              <Card.Footer>
                <Button variant="text" size="sm">
                  Action
                </Button>
              </Card.Footer>
            )}
          >
            <Card.Body>{sampleBody}</Card.Body>
          </Card.Root>
        )}
      </For>
    </div>
  ),
}

/** Spacing scales for different densities. */
export const Spacing: Story = {
  render: (args: Story['args']) => (
    <div style={{ display: 'grid', gap: '16px', width: '460px' }}>
      <For each={spacings}>
        {spacing => (
          <Card.Root
            {...args}
            spacing={spacing}
            header={(
              <Card.Header>
                <Card.Title>{spacing}</Card.Title>
                <Card.Description>Adjust padding and rhythm.</Card.Description>
              </Card.Header>
            )}
          >
            <Card.Body>{sampleBody}</Card.Body>
          </Card.Root>
        )}
      </For>
    </div>
  ),
}

/** Card with media cover and actions. */
export const WithMedia: Story = {
  render: (args: Story['args']) => (
    <Card.Root
      {...args}
      media={(
        <div
          style={{
            'background-image':
              'linear-gradient(120deg, var(--md-sys-color-primary, #6750a4), var(--md-sys-color-secondary, #625b71))',
            'height': '140px',
          }}
        />
      )}
      header={(
        <Card.Header>
          <Card.Title>Media card</Card.Title>
          <Card.Description>Use media for thumbnails or heroes.</Card.Description>
        </Card.Header>
      )}
      footer={(
        <Card.Footer>
          <Button variant="text" size="sm">
            Cancel
          </Button>
          <Button variant="filled" size="sm">
            Save
          </Button>
        </Card.Footer>
      )}
    >
      <Card.Body>{sampleBody}</Card.Body>
    </Card.Root>
  ),
}

/** Grid of all combinations for snapshot validation. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px', width: '520px' }}>
      <For each={variants}>
        {variant => (
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ 'text-transform': 'capitalize', 'color': 'var(--md-sys-color-on-surface-variant, #49454f)' }}>
              {variant}
            </div>
            <For each={spacings}>
              {spacing => (
                <Card.Root
                  variant={variant}
                  spacing={spacing}
                  header={(
                    <Card.Header>
                      <Card.Title>{spacing}</Card.Title>
                      <Card.Description>Sample content</Card.Description>
                    </Card.Header>
                  )}
                  footer={(
                    <Card.Footer>
                      <Button variant="text" size="sm">
                        Action
                      </Button>
                    </Card.Footer>
                  )}
                >
                  <Card.Body>{sampleBody}</Card.Body>
                </Card.Root>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  ),
}
