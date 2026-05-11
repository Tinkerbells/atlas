import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { DashboardResizeHandle } from "./index";

const meta = {
  title: "Shared/UI/DashboardResizeHandle",
  component: DashboardResizeHandle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A resize handle for the DashboardSidebar. It is hidden on mobile and visible on desktop (`lg:block`).",
      },
    },
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
      <div class="flex h-64 w-96">
        <div class="w-48 bg-gray-100 flex items-center justify-center text-sm text-gray-500">
          Sidebar
        </div>
        <DashboardResizeHandle v-bind="args" />
        <div class="flex-1 bg-gray-200 flex items-center justify-center text-sm text-gray-500">
          Content
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Default appearance. The handle is only visible on desktop (`lg:block`) and provides a `cursor: ew-resize` area between two panels.",
      },
    },
  },
};

export const WithCustomContent: Story = {
  render: args => ({
    components: { DashboardResizeHandle },
    setup() {
      return { args };
    },
    template: `
      <div class="flex h-64 w-96">
        <div class="w-48 bg-gray-100" />
        <DashboardResizeHandle v-bind="args">
          <div class="w-1 h-8 bg-gray-400 rounded-full mx-auto mt-24" />
        </DashboardResizeHandle>
        <div class="flex-1 bg-gray-200" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: "Use the default slot to render custom content inside the handle.",
      },
    },
  },
};
