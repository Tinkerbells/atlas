import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { Button } from "./index";

const meta = {
  title: "Shared/UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: { control: "text" },
    color: {
      control: "select",
      options: ["primary", "neutral", "error"],
    },
    variant: {
      control: "select",
      options: ["solid", "outline", "soft", "subtle", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    square: { control: "boolean" },
    block: { control: "boolean" },
    loading: { control: "boolean" },
    loadingAuto: { control: "boolean" },
    disabled: { control: "boolean" },
    icon: { control: "text" },
    leadingIcon: { control: "text" },
    trailingIcon: { control: "text" },
    leading: { control: "boolean" },
    trailing: { control: "boolean" },
    loadingIcon: { control: "text" },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Button",
  },
};

export const WithSlot: Story = {
  render: args => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <Button v-bind="args">
        Slot content
      </Button>
    `,
  }),
};

export const Colors: Story = {
  render: args => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <div class="flex gap-2 flex-wrap">
        <Button v-bind="args" color="primary" label="Primary" />
        <Button v-bind="args" color="neutral" label="Neutral" />
        <Button v-bind="args" color="error" label="Error" />
      </div>
    `,
  }),
  args: {
    variant: "solid",
  },
};

export const Variants: Story = {
  render: args => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <div class="flex gap-2 flex-wrap">
        <Button v-bind="args" variant="solid" label="Solid" />
        <Button v-bind="args" variant="outline" label="Outline" />
        <Button v-bind="args" variant="soft" label="Soft" />
        <Button v-bind="args" variant="subtle" label="Subtle" />
        <Button v-bind="args" variant="ghost" label="Ghost" />
        <Button v-bind="args" variant="link" label="Link" />
      </div>
    `,
  }),
  args: {
    color: "primary",
  },
};

export const Sizes: Story = {
  render: args => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <div class="flex items-center gap-2 flex-wrap">
        <Button v-bind="args" size="xs" label="xs" />
        <Button v-bind="args" size="sm" label="sm" />
        <Button v-bind="args" size="md" label="md" />
        <Button v-bind="args" size="lg" label="lg" />
        <Button v-bind="args" size="xl" label="xl" />
      </div>
    `,
  }),
};

export const WithIcon: Story = {
  args: {
    label: "Rocket",
    icon: "lucide:rocket",
    leading: true,
  },
};

export const WithTrailingIcon: Story = {
  args: {
    label: "Next",
    trailingIcon: "lucide:arrow-right",
    trailing: true,
  },
};

export const IconOnly: Story = {
  args: {
    icon: "lucide:search",
    color: "primary",
    variant: "solid",
  },
};

export const Loading: Story = {
  args: {
    label: "Loading",
    loading: true,
    leading: true,
  },
};

export const LoadingTrailing: Story = {
  args: {
    label: "Loading",
    loading: true,
    trailing: true,
  },
};

export const LoadingAuto: Story = {
  render: args => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <Button v-bind="args" :on-click="handleClick">
        Click me (1s)
      </Button>
    `,
    methods: {
      handleClick() {
        return new Promise<void>(res => setTimeout(res, 1000));
      },
    },
  }),
  args: {
    loadingAuto: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled",
    disabled: true,
  },
};

export const Block: Story = {
  args: {
    label: "Block button",
    block: true,
  },
};

export const Square: Story = {
  render: args => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <div class="flex items-center gap-2 flex-wrap">
        <Button v-bind="args" size="xs" icon="lucide:plus" />
        <Button v-bind="args" size="sm" icon="lucide:plus" />
        <Button v-bind="args" size="md" icon="lucide:plus" />
        <Button v-bind="args" size="lg" icon="lucide:plus" />
        <Button v-bind="args" size="xl" icon="lucide:plus" />
      </div>
    `,
  }),
  args: {
    square: true,
    color: "primary",
    variant: "solid",
  },
};

export const NeutralVariants: Story = {
  render: args => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <div class="flex gap-2 flex-wrap">
        <Button v-bind="args" variant="solid" label="Solid" />
        <Button v-bind="args" variant="outline" label="Outline" />
        <Button v-bind="args" variant="soft" label="Soft" />
        <Button v-bind="args" variant="subtle" label="Subtle" />
        <Button v-bind="args" variant="ghost" label="Ghost" />
        <Button v-bind="args" variant="link" label="Link" />
      </div>
    `,
  }),
  args: {
    color: "neutral",
  },
};

export const ErrorVariants: Story = {
  render: args => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <div class="flex gap-2 flex-wrap">
        <Button v-bind="args" variant="solid" label="Solid" />
        <Button v-bind="args" variant="outline" label="Outline" />
        <Button v-bind="args" variant="soft" label="Soft" />
        <Button v-bind="args" variant="subtle" label="Subtle" />
        <Button v-bind="args" variant="ghost" label="Ghost" />
        <Button v-bind="args" variant="link" label="Link" />
      </div>
    `,
  }),
  args: {
    color: "error",
  },
};
