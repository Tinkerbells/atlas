import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { ref } from "vue";
import { Button } from "@renderer/shared/ui/button";

import { DashboardSidebar } from "./index";

const meta = {
  title: "Shared/UI/DashboardSidebar",
  component: DashboardSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A resizable and collapsible sidebar to display in a dashboard. It supports drag-to-resize, state persistence and integrates with dashboard layouts. For a simple standalone sidebar, use Sidebar instead.",
      },
    },
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

export const Usage: Story = {
  render: args => ({
    components: { DashboardSidebar, Button },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args" v-model:open="open" resizable collapsible>
          <template #header="{ collapsed }">
            <span v-if="!collapsed" class="font-semibold text-sm text-highlighted">Acme Inc</span>
            <span v-else class="font-bold text-sm text-primary">A</span>
          </template>

          <template #default="{ collapsed }">
            <Button
              :label="collapsed ? undefined : 'Search...'"
              icon="lucide:search"
              color="neutral"
              variant="outline"
              block
              :square="collapsed"
            />

            <div class="space-y-1">
              <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2">
                <span class="w-4 h-4 flex items-center justify-center"><i class="i-lucide-house" /></span>
                <span v-if="!collapsed">Home</span>
              </div>
              <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2">
                <span class="w-4 h-4 flex items-center justify-center"><i class="i-lucide-inbox" /></span>
                <span v-if="!collapsed">Inbox</span>
              </div>
              <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2">
                <span class="w-4 h-4 flex items-center justify-center"><i class="i-lucide-users" /></span>
                <span v-if="!collapsed">Contacts</span>
              </div>
              <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2">
                <span class="w-4 h-4 flex items-center justify-center"><i class="i-lucide-settings" /></span>
                <span v-if="!collapsed">Settings</span>
              </div>
            </div>
          </template>

          <template #footer="{ collapsed }">
            <Button
              :label="collapsed ? undefined : 'Benjamin'"
              icon="lucide:user"
              color="neutral"
              variant="ghost"
              class="w-full"
              :block="collapsed"
            />
          </template>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Drag the handle to resize. Drag near the edge to collapse.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    mode: "slideover",
    toggle: true,
    autoClose: true,
    resizable: true,
    collapsible: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Full usage example with header, default and footer slots. Uses the `collapsed` slot prop to customize content when collapsed. The sidebar is both resizable and collapsible.",
      },
    },
  },
};

export const Resizable: Story = {
  render: args => ({
    components: { DashboardSidebar },
    setup() {
      return { args };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args">
          <template #header>
            <span class="font-semibold text-sm">Resizable</span>
          </template>
          <div class="h-96 bg-gray-50 rounded flex items-center justify-center text-sm text-gray-400">
            Content
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <p class="text-gray-600">Drag the handle to resize the sidebar. Double-click to reset size.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    resizable: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Use the `resizable` prop to make the sidebar resizable.",
      },
    },
  },
};

export const Collapsible: Story = {
  render: args => ({
    components: { DashboardSidebar },
    setup() {
      return { args };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args">
          <template #header="{ collapsed }">
            <span v-if="!collapsed" class="font-semibold text-sm">Collapsible</span>
            <span v-else class="font-semibold text-sm">C</span>
          </template>

          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center text-xs">H</span>
              <span v-if="!args.collapsed">Home</span>
            </div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <p class="text-gray-600">Drag the handle near the edge to auto-collapse.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    resizable: true,
    collapsible: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the `collapsible` prop to make the sidebar collapsible when dragging near the edge. The `DashboardSidebarCollapse` component will have no effect if the sidebar is not collapsible.",
      },
    },
  },
};

export const Size: Story = {
  render: args => ({
    components: { DashboardSidebar },
    setup() {
      return { args };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args">
          <template #header>
            <span class="font-semibold text-sm">Custom Size</span>
          </template>
          <div class="h-96 bg-gray-50 rounded flex items-center justify-center text-sm text-gray-400">
            Content
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <p class="text-gray-600">minSize=22, defaultSize=35, maxSize=40, collapsedSize=0</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    resizable: true,
    collapsible: true,
    minSize: 22,
    defaultSize: 35,
    maxSize: 40,
    collapsedSize: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the `min-size`, `max-size`, `default-size` and `collapsed-size` props to customize the size of the sidebar. Sizes are calculated as percentages by default.",
      },
    },
  },
};

export const Side: Story = {
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
            <span class="font-semibold text-sm">Right</span>
          </template>
          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Details</div>
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Properties</div>
          </div>
        </DashboardSidebar>
      </div>
    `,
  }),
  args: {
    side: "right",
    resizable: true,
    collapsible: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Use the `side` prop to change the side of the sidebar. Defaults to `left`.",
      },
    },
  },
};

export const Mode: Story = {
  render: args => ({
    components: { DashboardSidebar, Button },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args" v-model:open="open">
          <template #header="{ collapsed }">
            <span v-if="!collapsed" class="font-semibold text-sm">Mode: {{ args.mode }}</span>
            <span v-else class="font-semibold text-sm">M</span>
          </template>
          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Home</div>
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Inbox</div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Mobile menu mode: {{ args.mode }}</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    mode: "modal",
    toggle: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the `mode` prop to change the mode of the sidebar menu on mobile. Defaults to `slideover`. Options: `modal`, `slideover`, `drawer`.",
      },
    },
  },
};

export const Toggle: Story = {
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
            <span class="font-semibold text-sm">Custom Toggle</span>
          </template>
          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Home</div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <p class="text-gray-600">The toggle button on mobile is customized via the toggle prop.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    mode: "slideover",
    toggle: {
      color: "primary",
      variant: "subtle",
    },
  } as any,
  parameters: {
    docs: {
      description: {
        story:
          "Use the `toggle` prop to customize the DashboardSidebarToggle component displayed on mobile. You can pass any Button property.",
      },
    },
  },
};

export const ToggleSide: Story = {
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
            <span class="font-semibold text-sm">Toggle Right</span>
          </template>
          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Home</div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">The toggle button is rendered on the right side.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    mode: "slideover",
    toggle: true,
    toggleSide: "right",
  },
  parameters: {
    docs: {
      description: {
        story: "Use the `toggle-side` prop to change the side of the toggle button. Defaults to `left`.",
      },
    },
  },
};

export const ControlOpenState: Story = {
  render: args => ({
    components: { DashboardSidebar, Button },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <DashboardSidebar v-bind="args" v-model:open="open">
          <template #header="{ collapsed }">
            <span v-if="!collapsed" class="font-semibold text-sm">Controlled</span>
            <span v-else class="font-semibold text-sm">C</span>
          </template>
          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Home</div>
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Settings</div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6 space-y-4">
          <Button label="Toggle Open" @click="open = !open" />
          <p class="text-gray-600">Open state: {{ open }}</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    toggle: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Control the open state by using the `v-model:open` directive.",
      },
    },
  },
};

export const ControlCollapsedState: Story = {
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
          <template #header="{ collapsed: isCollapsed }">
            <span v-if="!isCollapsed" class="font-semibold text-sm">Dashboard</span>
            <span v-else class="font-semibold text-sm">D</span>
          </template>

          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center text-xs">H</span>
              <span v-if="!collapsed">Home</span>
            </div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6 space-y-4">
          <Button label="Toggle Open" @click="open = !open" />
          <Button label="Toggle Collapsed" @click="collapsed = !collapsed" />
          <p class="text-gray-600">Collapsed: {{ collapsed }}</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    resizable: true,
    collapsible: true,
    collapsedSize: 4,
    toggle: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Control the collapsed state by using the `v-model:collapsed` directive. The sidebar must be `collapsible` for this to work.",
      },
    },
  },
};

export const WithCustomResizeHandle: Story = {
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
            <span class="font-semibold text-sm">Custom Handle</span>
          </template>

          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Item</div>
          </div>

          <template #resize-handle="{ onMouseDown, onTouchStart, onDoubleClick }">
            <div
              class="hidden lg:flex w-1 bg-gray-300 hover:bg-gray-400 cursor-ew-resize items-center justify-center transition-colors"
              @mousedown="onMouseDown"
              @touchstart="onTouchStart"
              @dblclick="onDoubleClick"
            >
              <div class="w-0.5 h-6 bg-gray-500 rounded-full" />
            </div>
          </template>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Custom resize handle with a visual grip.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    resizable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the `resize-handle` slot to customize the resize handle. The slot exposes `onMouseDown`, `onTouchStart` and `onDoubleClick` handlers.",
      },
    },
  },
};

export const WithToggleSlot: Story = {
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
            <Button size="sm" variant="outline" label="Menu" @click="toggle" />
          </template>

          <template #header>
            <span class="font-semibold text-sm">Slot Toggle</span>
          </template>

          <div class="space-y-1">
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Link 1</div>
            <div class="px-2 py-1.5 rounded text-sm hover:bg-gray-100 cursor-pointer">Link 2</div>
          </div>
        </DashboardSidebar>

        <main class="flex-1 p-6">
          <p class="text-gray-600">Custom toggle button via the toggle slot.</p>
        </main>
      </div>
    `,
  }),
  args: {
    side: "left",
    toggle: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Use the `toggle` slot to fully customize the toggle button displayed on mobile.",
      },
    },
  },
};
