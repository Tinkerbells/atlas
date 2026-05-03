import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { DashboardSidebarCollapse } from "./index";

const meta = {
  title: "Shared/UI/DashboardSidebarCollapse",
  component: DashboardSidebarCollapse,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A Button to collapse the sidebar on desktop. Extends the Button component. It is hidden on mobile and visible on desktop (`lg:flex`).",
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
} satisfies Meta<typeof DashboardSidebarCollapse>;

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
          "Default appearance. The button defaults to `color=\"neutral\"` and `variant=\"ghost\"`. Note: this component is only visible on desktop (`lg:flex`).",
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
    components: { DashboardSidebarCollapse },
    setup() {
      return { args };
    },
    template: `
      <div class="flex gap-2 flex-wrap">
        <DashboardSidebarCollapse v-bind="args" color="primary" />
        <DashboardSidebarCollapse v-bind="args" color="neutral" />
        <DashboardSidebarCollapse v-bind="args" color="error" />
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
        story: "Use the `side` prop to change the side of the collapse button.",
      },
    },
  },
};

export const Sizes: Story = {
  render: args => ({
    components: { DashboardSidebarCollapse },
    setup() {
      return { args };
    },
    template: `
      <div class="flex items-center gap-2 flex-wrap">
        <DashboardSidebarCollapse v-bind="args" size="xs" />
        <DashboardSidebarCollapse v-bind="args" size="sm" />
        <DashboardSidebarCollapse v-bind="args" size="md" />
        <DashboardSidebarCollapse v-bind="args" size="lg" />
        <DashboardSidebarCollapse v-bind="args" size="xl" />
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
