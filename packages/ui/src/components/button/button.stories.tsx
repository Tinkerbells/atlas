import type { Meta, StoryObj } from 'storybook-solidjs'
import { For } from 'solid-js'
import Button from './index'
import { ButtonGroup } from '../button-group'
import type { ButtonProps, ButtonSize, ButtonType } from './props'

const meta: Meta<ButtonProps> = {
  title: 'MD3/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Button',
    type: 'primary',
    size: 'normal',
  },
  argTypes: {
    type: { control: { type: 'select' }, options: ['default', 'primary', 'info', 'success', 'warning', 'danger'] },
    size: { control: { type: 'select' }, options: ['mini', 'small', 'normal', 'large'] },
    text: { control: 'boolean' },
    outline: { control: 'boolean' },
    iconContainer: { control: 'boolean' },
    block: { control: 'boolean' },
    round: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<ButtonProps>

export const Basic: Story = {}

export const Variants: Story = {
  render: (args: ButtonProps) => (
    <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap' }}>
      <For each={['default', 'primary', 'info', 'success', 'warning', 'danger'] as ButtonType[]}>
        {(type) => <Button {...args} type={type}>{type}</Button>}
      </For>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args: ButtonProps) => (
    <div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
      <For each={['mini', 'small', 'normal', 'large'] as ButtonSize[]}>
        {(size) => <Button {...args} size={size}>{size}</Button>}
      </For>
    </div>
  ),
}

export const TextAndOutline: Story = {
  args: {
    text: true,
    type: 'primary',
  },
  render: (args: ButtonProps) => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Button {...args}>Text</Button>
      <Button {...args} outline text={false}>Outline</Button>
    </div>
  ),
}

export const BlockAndRound: Story = {
  render: (args: ButtonProps) => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <Button {...args} block>Block button</Button>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button {...args} round iconContainer aria-label="Icon">★</Button>
        <Button {...args} round>R</Button>
      </div>
    </div>
  ),
}

export const LoadingState: Story = {
  args: {
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const Grouped: Story = {
  render: (args: ButtonProps) => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <ButtonGroup>
        <Button {...args}>Left</Button>
        <Button {...args} type="primary">Center</Button>
        <Button {...args} type="danger">Right</Button>
      </ButtonGroup>
      <ButtonGroup mode="text">
        <Button {...args} text type="primary">One</Button>
        <Button {...args} text type="primary">Two</Button>
        <Button {...args} text type="primary">Three</Button>
      </ButtonGroup>
      <ButtonGroup vertical>
        <Button {...args}>Top</Button>
        <Button {...args}>Middle</Button>
        <Button {...args}>Bottom</Button>
      </ButtonGroup>
    </div>
  ),
}
