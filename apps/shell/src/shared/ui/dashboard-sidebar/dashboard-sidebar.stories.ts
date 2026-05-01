import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { ref } from "vue";
import { Button } from "~/shared/ui/button";

import { DashboardSidebar } from "./index";

const meta = {
  title: "Shared/UI/DashboardSidebar",
  component: DashboardSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    side: {
      control: "select",
      options: ["left", "right"],
    },
    mode: {
      control: "select",
      options: ["modal", "slideover", "drawer"],
    },
    resizable: { control: "boolean" },
    collapsible: { control: "boolean" },
    autoClose: { control: "boolean" },
    toggle: { control: "boolean" },
    toggleSide: {
      control: "select",
      options: ["left", "right"],
    },
    minSize: { control: "number" },
    maxSize: { control: "number" },
    defaultSize: { control: "number" },
    collapsedSize: { control: "number" },
  },
} satisfies Meta<typeof DashboardSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => ({
    components: { DashboardSidebar, Button },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args" v-model:open="open">
          <template #header>
            <span class="font-semibold">Dashboard</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Home</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Analytics</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Settings</div>
          </div>

          <template #footer>
            <Button size="sm" label="Logout" variant="ghost" color="neutral" />
          </template>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Main content area</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    mode: "slideover",
    toggle: true,
    autoClose: true,
  },
};

export const Resizable: Story = {
  render: args => ({
    components: { DashboardSidebar, Button },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args" v-model:open="open">
          <template #header>
            <span class="font-semibold">Resizable</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Item 1</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Item 2</div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Drag the handle to resize the sidebar.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    resizable: true,
    minSize: 10,
    maxSize: 30,
    defaultSize: 15,
    toggle: true,
  },
};

export const Collapsible: Story = {
  render: args => ({
    components: { DashboardSidebar, Button },
    setup() {
      const open = ref(false);
      const collapsed = ref(false);
      return { args, open, collapsed };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args" v-model:open="open" v-model:collapsed="collapsed">
          <template #header>
            <span class="font-semibold" v-if="!collapsed">Dashboard</span>
            <span class="font-semibold" v-else>D</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-5 h-5 flex items-center justify-center">H</span>
              <span v-if="!collapsed">Home</span>
            </div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-5 h-5 flex items-center justify-center">A</span>
              <span v-if="!collapsed">Analytics</span>
            </div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Collapsed: {{ collapsed }}</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    collapsible: true,
    collapsedSize: 4,
    toggle: true,
  },
};

export const RightSide: Story = {
  render: args => ({
    components: { DashboardSidebar, Button },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Main content area</p>
        </main>

        <DashboardSidebar v-bind="args" v-model:open="open">
          <template #header>
            <span class="font-semibold">Right Panel</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Details</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Properties</div>
          </div>
        </DashboardSidebar>
      </div>
    `,
  }),
  args: {
    side: "right",
    mode: "slideover",
    toggle: true,
    toggleSide: "right",
  },
};

export const WithCustomToggle: Story = {
  render: args => ({
    components: { DashboardSidebar, Button },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args" v-model:open="open">
          <template #toggle="{ toggle }">
            <Button size="sm" variant="outline" label="Custom Toggle" @click="toggle" />
          </template>

          <template #header>
            <span class="font-semibold">Custom</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Link 1</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Link 2</div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <p class="text-gray-600">Main content area with custom toggle button.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    toggle: true,
  },
};
