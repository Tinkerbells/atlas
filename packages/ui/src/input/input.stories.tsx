import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Camera } from 'lucide-solid'

import { Input } from './input'

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'extra'],
    },
    border: { control: 'boolean' },
    round: { control: 'boolean' },
    fill: { control: 'boolean' },
    invalid: {
      control: 'boolean',
    },
    label: { control: 'text' },
    helperText: { control: 'text' },
    errorText: { control: 'text' },
  },
  args: {
    size: 'md',
    border: true,
    round: false,
    fill: false,
    placeholder: 'Type something…',
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '16px', width: '420px' }}>
      <div>
        <h4>Default</h4>
        <Input {...args} helperText="Helper text" />
      </div>
      <div>
        <h4>Label + Helper</h4>
        <Input {...args} label="Label" helperText="Helper text" />
      </div>
      <div>
        <h4>Invalid + Error</h4>
        <Input {...args} label="Email" invalid errorText="Error text" />
      </div>
      <div>
        <h4>Disabled</h4>
        <Input {...args} disabled value="Disabled value" label="Disabled" />
      </div>
      <div>
        <h4>Prefix / Suffix</h4>
        <Input
          {...args}
          label="Search"
          prefixIcon={<Camera size={18} />}
          suffixIcon={<Camera size={18} />}
        />
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '12px', width: '420px' }}>
      <Input {...args} size="sm" label="Small" placeholder="Small input" />
      <Input {...args} size="md" label="Medium" placeholder="Medium input" />
      <Input {...args} size="lg" label="Large" placeholder="Large input" />
      <Input {...args} size="extra" label="Extra" placeholder="Extra input" />
    </div>
  ),
}

export const Variants: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '12px', width: '420px' }}>
      <Input {...args} border label="Border" placeholder="Border input" />
      <Input {...args} border={false} round label="Round" placeholder="Round input" />
      <Input {...args} border fill label="Fill" placeholder="Fill input" />
      <Input
        {...args}
        border
        round
        label="Border + Round"
        placeholder="Bordered rounded input"
      />
      <Input
        {...args}
        border
        round
        fill
        label="Border + Round + Fill"
        placeholder="Combined input"
      />
    </div>
  ),
}
