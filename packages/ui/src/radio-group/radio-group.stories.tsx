import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { RadioGroup } from './radio-group'

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup.Root,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    size: 'md',
  },
} satisfies Meta<typeof RadioGroup.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Options: Story = {
  render: (args: Story['args']) => (
    <RadioGroup.Root {...args} defaultValue="solid">
      <RadioGroup.Label>Framework</RadioGroup.Label>
      <RadioGroup.Item value="solid">
        <RadioGroup.ItemControl>
          <RadioGroup.Indicator />
        </RadioGroup.ItemControl>
        <RadioGroup.ItemText>Solid</RadioGroup.ItemText>
        <RadioGroup.ItemHiddenInput />
      </RadioGroup.Item>
      <RadioGroup.Item value="react">
        <RadioGroup.ItemControl>
          <RadioGroup.Indicator />
        </RadioGroup.ItemControl>
        <RadioGroup.ItemText>React</RadioGroup.ItemText>
        <RadioGroup.ItemHiddenInput />
      </RadioGroup.Item>
      <RadioGroup.Item value="vue" disabled>
        <RadioGroup.ItemControl>
          <RadioGroup.Indicator />
        </RadioGroup.ItemControl>
        <RadioGroup.ItemText>Vue (disabled)</RadioGroup.ItemText>
        <RadioGroup.ItemHiddenInput />
      </RadioGroup.Item>
    </RadioGroup.Root>
  ),
}
