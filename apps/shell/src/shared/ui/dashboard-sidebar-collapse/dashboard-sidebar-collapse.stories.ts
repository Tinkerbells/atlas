import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { DashboardSidebarCollapse } from "./index";

const meta = {
  title: "Shared/UI/DashboardSidebarCollapse",
  component: DashboardSidebarCollapse,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
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
};

export const SideRight: Story = {
  args: {
    color: "neutral",
    variant: "ghost",
    side: "right",
  },
};

export const PrimarySolid: Story = {
  args: {
    color: "primary",
    variant: "solid",
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
