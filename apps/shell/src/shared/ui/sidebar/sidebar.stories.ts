import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { ref } from "vue";
import { Button } from "~/shared/ui/button";

import { Sidebar } from "./index";

const meta = {
  title: "Shared/UI/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
    },
    side: {
      control: "select",
      options: ["left", "right"],
    },
    mode: {
      control: "select",
      options: ["modal", "slideover", "drawer"],
    },
    close: { control: "boolean" },
    rail: { control: "boolean" },
    title: { control: "text" },
    description: { control: "text" },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => ({
    components: { Sidebar, Button },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <Sidebar v-bind="args" v-model:open="open">
          <template #header>
            <span class="font-semibold">Sidebar</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Dashboard</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Team</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Projects</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Calendar</div>
          </div>

          <template #footer>
            <Button size="sm" label="Settings" variant="ghost" color="neutral" />
          </template>
        </Sidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Main content area</p>
        </main>
      </div>
    `,
  }),
  args: {
    variant: "sidebar",
    collapsible: "offcanvas",
    side: "left",
    close: false,
    rail: false,
  },
};

export const Floating: Story = {
  ...Default,
  args: {
    ...Default.args,
    variant: "floating",
    title: "Floating Sidebar",
  },
};

export const Inset: Story = {
  ...Default,
  args: {
    ...Default.args,
    variant: "inset",
    title: "Inset Sidebar",
  },
};

export const IconCollapsible: Story = {
  render: args => ({
    components: { Sidebar, Button },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <Sidebar v-bind="args" v-model:open="open">
          <template #header>
            <span class="font-semibold" v-if="open">App</span>
            <span class="font-semibold" v-else>A</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-5 h-5 flex items-center justify-center">D</span>
              <span v-if="open">Dashboard</span>
            </div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-5 h-5 flex items-center justify-center">T</span>
              <span v-if="open">Team</span>
            </div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-5 h-5 flex items-center justify-center">P</span>
              <span v-if="open">Projects</span>
            </div>
          </div>
        </Sidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Icon-only when collapsed</p>
        </main>
      </div>
    `,
  }),
  args: {
    variant: "sidebar",
    collapsible: "icon",
    side: "left",
    close: false,
    rail: false,
  },
};

export const WithRail: Story = {
  render: args => ({
    components: { Sidebar, Button },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <Sidebar v-bind="args" v-model:open="open">
          <template #header>
            <span class="font-semibold" v-if="open">App</span>
            <span class="font-semibold" v-else>A</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-5 h-5 flex items-center justify-center">D</span>
              <span v-if="open">Dashboard</span>
            </div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2">
              <span class="w-5 h-5 flex items-center justify-center">T</span>
              <span v-if="open">Team</span>
            </div>
          </div>
        </Sidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Hover the rail edge to resize</p>
        </main>
      </div>
    `,
  }),
  args: {
    variant: "sidebar",
    collapsible: "icon",
    side: "left",
    close: false,
    rail: true,
  },
};

export const NonCollapsible: Story = {
  render: args => ({
    components: { Sidebar },
    setup() {
      return { args };
    },
    template: `
      <div class="flex min-h-screen">
        <Sidebar v-bind="args">
          <template #header>
            <span class="font-semibold">Fixed</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Home</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">About</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Contact</div>
          </div>
        </Sidebar>

        <main class="flex-1 p-6">
          <p class="text-gray-600">This sidebar is always visible and not collapsible.</p>
        </main>
      </div>
    `,
  }),
  args: {
    variant: "sidebar",
    collapsible: "none",
    side: "left",
  },
};

export const RightSide: Story = {
  render: args => ({
    components: { Sidebar, Button },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Main content area</p>
        </main>

        <Sidebar v-bind="args" v-model:open="open">
          <template #header>
            <span class="font-semibold">Right</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Details</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Properties</div>
          </div>
        </Sidebar>
      </div>
    `,
  }),
  args: {
    variant: "sidebar",
    collapsible: "offcanvas",
    side: "right",
    close: false,
    rail: false,
  },
};

export const WithCloseButton: Story = {
  render: args => ({
    components: { Sidebar, Button },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <Sidebar v-bind="args" v-model:open="open">
          <template #header>
            <span class="font-semibold">Closable</span>
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Item 1</div>
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Item 2</div>
          </div>
        </Sidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
          <p class="mt-4 text-gray-600">Has a close button in the header</p>
        </main>
      </div>
    `,
  }),
  args: {
    variant: "sidebar",
    collapsible: "icon",
    side: "left",
    close: true,
    rail: false,
  },
};

export const WithTitleAndDescription: Story = {
  render: args => ({
    components: { Sidebar },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <Sidebar v-bind="args" v-model:open="open" />

        <main class="flex-1 p-6">
          <p class="text-gray-600">Sidebar with title and description props.</p>
        </main>
      </div>
    `,
  }),
  args: {
    variant: "sidebar",
    collapsible: "none",
    side: "left",
    title: "Application",
    description: "Manage your workspace",
  },
};

export const WithCustomSlots: Story = {
  render: args => ({
    components: { Sidebar, Button },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div class="flex min-h-screen">
        <Sidebar v-bind="args" v-model:open="open">
          <template #title>
            <span class="text-primary font-bold">Custom Title</span>
          </template>

          <template #description>
            <span class="text-sm text-muted">Custom description slot</span>
          </template>

          <template #actions>
            <Button size="xs" variant="ghost" icon="lucide:plus" />
          </template>

          <div class="space-y-2">
            <div class="p-2 rounded hover:bg-gray-100 cursor-pointer">Content</div>
          </div>

          <template #footer>
            <div class="text-xs text-muted">v1.0.0</div>
          </template>
        </Sidebar>

        <main class="flex-1 p-6">
          <Button label="Toggle Sidebar" @click="open = !open" />
        </main>
      </div>
    `,
  }),
  args: {
    variant: "sidebar",
    collapsible: "icon",
    side: "left",
    close: true,
  },
};
