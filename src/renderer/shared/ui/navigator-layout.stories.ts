import type { Meta, StoryObj } from "@storybook/vue3-vite";

import type { NavigatorPaneGroup } from "./navigator-layout.vue";

import NavigatorLayout from "./navigator-layout.vue";

const meta = {
  title: "UI/NavigatorLayout",
  component: NavigatorLayout,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NavigatorLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockPaneGroups: NavigatorPaneGroup[] = [
  {
    id: "group-1",
    isActive: true,
    panes: [
      { id: "pane-1", type: 1, title: "Home", isActive: true },
      { id: "pane-2", type: 3, title: "README.md", isActive: false },
    ],
  },
];

const mockMultipleGroups: NavigatorPaneGroup[] = [
  {
    id: "group-1",
    isActive: true,
    panes: [
      { id: "pane-1", type: 1, title: "Home", isActive: true },
      { id: "pane-2", type: 3, title: "README.md", isActive: false },
    ],
  },
  {
    id: "group-2",
    isActive: false,
    panes: [
      { id: "pane-3", type: 2, title: "Commander", isActive: true },
    ],
  },
];

export const Default: Story = {
  args: {
    paneGroups: mockPaneGroups,
  },
};

export const Empty: Story = {
  args: {
    paneGroups: [],
  },
};

export const MultipleGroups: Story = {
  args: {
    paneGroups: mockMultipleGroups,
  },
};

export const ActivePane: Story = {
  args: {
    paneGroups: mockPaneGroups,
    activePaneTitle: "Home",
  },
};

export const WithCustomContent: Story = {
  args: {
    paneGroups: mockPaneGroups,
  },
  render: args => ({
    components: { NavigatorLayout },
    setup() {
      return { args };
    },
    template: `
      <NavigatorLayout v-bind="args">
        <template #group-0="{ group }">
          <div class="flex-1 flex items-center justify-center text-muted">
            <div class="flex flex-col items-center gap-2">
              <UIcon name="i-lucide-folder-open" class="w-8 h-8" />
              <span class="text-sm">Content for {{ group.panes[0]?.title ?? "pane" }}</span>
            </div>
          </div>
        </template>
      </NavigatorLayout>
    `,
  }),
};

export const WithCustomStatus: Story = {
  args: {
    paneGroups: mockPaneGroups,
  },
  render: args => ({
    components: { NavigatorLayout },
    setup() {
      return { args };
    },
    template: `
      <NavigatorLayout v-bind="args">
        <template #status-right>
          <span class="text-primary">Custom Status</span>
        </template>
      </NavigatorLayout>
    `,
  }),
};
