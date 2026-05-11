import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { DashboardSidebarToggle } from "./index";

const meta = {
  title: "Shared/UI/DashboardSidebarToggle",
  component: DashboardSidebarToggle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A Button to toggle the sidebar on mobile. Extends the Button component.",
      },
    },
  },
  argTypes: {
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
    side: {
      control: "select",
      options: ["left", "right"],
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
  },
} satisfies Meta<typeof DashboardSidebarToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    color: "neutral",
    variant: "ghost",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default appearance. The button defaults to `color=\"neutral\"` and `variant=\"ghost\"`.",
      },
    },
  },
};

export const VariantSubtle: Story = {
  args: {
    color: "neutral",
    variant: "subtle",
  },
  parameters: {
    docs: {
      description: {
        story: "Use the `variant` prop to change the visual style.",
      },
    },
  },
};

export const Colors: Story = {
  render: args => ({
    components: { DashboardSidebarToggle },
    setup() {
      return { args };
    },
    template: `
      <div class="flex gap-2 flex-wrap">
        <DashboardSidebarToggle v-bind="args" color="primary" />
        <DashboardSidebarToggle v-bind="args" color="neutral" />
        <DashboardSidebarToggle v-bind="args" color="error" />
      </div>
    `,
  }),
  args: {
    variant: "ghost",
  },
  parameters: {
    docs: {
      description: {
        story: "Use the `color` prop to change the color.",
      },
    },
  },
};

export const SideRight: Story = {
  args: {
    color: "neutral",
    variant: "ghost",
    side: "right",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the `side` prop to change the side of the toggle button. When `side=\"right\"`, the button is pushed to the right.",
      },
    },
  },
};

export const Sizes: Story = {
  render: args => ({
    components: { DashboardSidebarToggle },
    setup() {
      return { args };
    },
    template: `
      <div class="flex items-center gap-2 flex-wrap">
        <DashboardSidebarToggle v-bind="args" size="xs" />
        <DashboardSidebarToggle v-bind="args" size="sm" />
        <DashboardSidebarToggle v-bind="args" size="md" />
        <DashboardSidebarToggle v-bind="args" size="lg" />
        <DashboardSidebarToggle v-bind="args" size="xl" />
      </div>
    `,
  }),
  args: {
    color: "neutral",
    variant: "ghost",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    color: "neutral",
    variant: "ghost",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    color: "neutral",
    variant: "ghost",
  },
};
