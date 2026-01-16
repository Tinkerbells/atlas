import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'
import { X } from 'lucide-solid'

import type { DialogSize, DialogVariant } from './dialog'

import { Dialog } from './dialog'
import { Button } from '../button'
import { IconButton } from '../icon-button'

const sizes = ['sm', 'md', 'lg'] as const
const variants = ['standard', 'fullscreen'] as const

interface DialogStoryArgs {
  size: DialogSize
  variant: DialogVariant
  defaultOpen: boolean
}

const meta = {
  title: 'Components/Dialog',
  component: Dialog.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
      description: 'Width and padding scale of the dialog surface.',
    },
    variant: {
      control: 'select',
      options: variants,
      description: 'Standard or fullscreen layout.',
    },
    defaultOpen: {
      control: 'boolean',
    },
  },
  args: {
    size: 'md',
    variant: 'standard',
    defaultOpen: false,
  },
} satisfies Meta<DialogStoryArgs>

export default meta
type Story = StoryObj<DialogStoryArgs>

const actions = (
  <Dialog.Footer>
    <Button variant="text" size="sm">
      Cancel
    </Button>
    <Button variant="filled" size="sm">
      Confirm
    </Button>
  </Dialog.Footer>
)

/** Base dialog with trigger, title, description, and actions. */
export const Base: Story = {
  render: (args: DialogStoryArgs) => (
    <Dialog.Root defaultOpen={args.defaultOpen}>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content size={args.size} variant={args.variant}>
          <Dialog.Title>Invite teammates</Dialog.Title>
          <Dialog.Description>
            Share access to this project with your team. You can revoke permissions at any time.
          </Dialog.Description>
          <Dialog.Body>
            Use dialogs for critical decisions or contextual tasks that require focus.
          </Dialog.Body>
          {actions}
          <Dialog.CloseTrigger asChild={props => <IconButton {...props} aria-label="Close dialog"><X /></IconButton>} />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
}

/** Demonstrates size options. */
export const Sizes: Story = {
  render: (args: DialogStoryArgs) => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <For each={sizes}>
        {size => (
          <Dialog.Root>
            <Dialog.Trigger>
              {size}
              {' '}
              dialog
            </Dialog.Trigger>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content size={size} variant={args.variant}>
                <Dialog.Title>
                  {size.toUpperCase()}
                  {' '}
                  width
                </Dialog.Title>
                <Dialog.Description>Adjusts max width and padding.</Dialog.Description>
                <Dialog.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vitae orci ut
                  nisl sagittis accumsan quis in quam.
                </Dialog.Body>
                {actions}
                <Dialog.CloseTrigger asChild={props => <IconButton {...props} aria-label="Close dialog"><X /></IconButton>} />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>
        )}
      </For>
    </div>
  ),
}

/** Fullscreen surface for mobile or immersive flows. */
export const Fullscreen: Story = {
  args: {
    variant: 'fullscreen',
  },
  render: (args: DialogStoryArgs) => (
    <Dialog.Root>
      <Dialog.Trigger>Fullscreen dialog</Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content size={args.size} variant={args.variant}>
          <Dialog.Title>Fullscreen layout</Dialog.Title>
          <Dialog.Description>Use for large forms or content-heavy tasks.</Dialog.Description>
          <Dialog.Body>
            <p>
              Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum
              massa justo sit amet risus. Lorem ipsum dolor sit amet.
            </p>
            <p>
              Aenean lacinia bibendum nulla sed consectetur. Aenean eu leo quam. Pellentesque ornare
              sem lacinia quam venenatis vestibulum.
            </p>
          </Dialog.Body>
          {actions}
          <Dialog.CloseTrigger asChild={props => <IconButton {...props} aria-label="Close dialog"><X /></IconButton>} />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
}

/** Overflowing content to showcase scrollable body. */
export const Scrollable: Story = {
  render: (args: DialogStoryArgs) => (
    <Dialog.Root>
      <Dialog.Trigger>Scrollable dialog</Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content size={args.size} variant={args.variant}>
          <Dialog.Title>Long content</Dialog.Title>
          <Dialog.Description>Body scrolls independently of header/footer.</Dialog.Description>
          <Dialog.Body>
            <For each={Array.from({ length: 8 })}>
              {(_, index) => (
                <p>
                  Paragraph
                  {' '}
                  {index() + 1}
                  : Curabitur blandit tempus porttitor. Cras mattis consectetur
                  purus sit amet fermentum.
                </p>
              )}
            </For>
          </Dialog.Body>
          {actions}
          <Dialog.CloseTrigger asChild={props => <IconButton {...props} aria-label="Close dialog"><X /></IconButton>} />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
}

/** Gallery combining sizes and variants for snapshots. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <For each={variants}>
        {variant => (
          <div style={{ 'display': 'flex', 'gap': '10px', 'align-items': 'flex-start', 'flex-wrap': 'wrap' }}>
            <div style={{ 'width': '120px', 'text-transform': 'capitalize' }}>{variant}</div>
            <For each={sizes}>
              {size => (
                <Dialog.Root defaultOpen={size === 'sm'}>
                  <Dialog.Trigger>{`${size} ${variant}`}</Dialog.Trigger>
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content size={size} variant={variant}>
                      <Dialog.Title>
                        {size}
                        {' '}
                        {variant}
                      </Dialog.Title>
                      <Dialog.Description>Snapshot view.</Dialog.Description>
                      <Dialog.Body>Surface preview.</Dialog.Body>
                      {actions}
                      <Dialog.CloseTrigger aria-label="Close dialog">✕</Dialog.CloseTrigger>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Dialog.Root>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  ),
}
