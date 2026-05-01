import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { DashboardResizeHandle } from "./index";

const meta = {
  title: "Shared/UI/DashboardResizeHandle",
  component: DashboardResizeHandle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DashboardResizeHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => ({
    components: { DashboardResizeHandle },
    setup() {
      return { args };
    },
    template: `
      <div class="flex h-64">
        <div class="w-48 bg-gray-100" />
        <DashboardResizeHandle v-bind="args" />
        <div class="flex-1 bg-gray-200" />
      </div>
    `,
  }),
};
