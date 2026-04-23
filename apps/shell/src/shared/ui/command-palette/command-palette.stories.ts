import type { Meta, StoryObj } from "@storybook/vue3-vite";

import type { CommandPaletteGroup, CommandPaletteItem } from "./command-pallete.vue";

import { CommandPalette } from "./index";

const sampleItems: CommandPaletteItem[] = [
  {
    label: "Open File",
    icon: "📁",
    kbds: ["⌘", "O"],
    description: "Open a file from disk",
    onSelect: e => console.log("Open File", e),
  },
  {
    label: "Save File",
    icon: "💾",
    kbds: ["⌘", "S"],
    description: "Save the current file",
  },
  {
    label: "Find in Project",
    icon: "🔍",
    kbds: ["⌘", "⇧", "F"],
    description: "Search across all project files",
  },
  {
    label: "Toggle Terminal",
    icon: "🖥️",
    kbds: ["⌘", "`"],
  },
  {
    label: "Go to Line",
    icon: "↕️",
    kbds: ["⌘", "G"],
    description: "Jump to a specific line number",
  },
];

const sampleGroups: CommandPaletteGroup[] = [
  {
    id: "recent",
    label: "Recent",
    items: [
      { label: "src/app.vue", icon: "📄", description: "Modified 2 min ago" },
      { label: "src/main.ts", icon: "📄", description: "Modified 1 hour ago" },
    ],
  },
  {
    id: "commands",
    label: "Commands",
    items: sampleItems,
  },
];

const nestedGroups: CommandPaletteGroup[] = [
  {
    id: "files",
    label: "Files",
    items: [
      {
        label: "src/",
        icon: "📁",
        children: [
          {
            label: "components/",
            icon: "📁",
            children: [
              { label: "Header.vue", icon: "📄" },
              { label: "Footer.vue", icon: "📄" },
              { label: "Sidebar.vue", icon: "📄" },
            ],
          },
          { label: "app.vue", icon: "📄" },
          { label: "main.ts", icon: "📄" },
        ],
      },
      {
        label: "package.json",
        icon: "📄",
        description: "Project manifest",
      },
    ],
  },
];

const largeGroups: CommandPaletteGroup[] = Array.from({ length: 5 }, (_, gIdx) => ({
  id: `group-${gIdx}`,
  label: `Group ${gIdx + 1}`,
  items: Array.from({ length: 20 }, (_, iIdx) => ({
    label: `Item ${gIdx * 20 + iIdx + 1}`,
    icon: "📌",
    description: iIdx % 3 === 0 ? `Description for item ${gIdx * 20 + iIdx + 1}` : undefined,
  })),
}));

const meta = {
  title: "Shared/UI/CommandPalette",
  component: CommandPalette,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    placeholder: "Type a command or search...",
    autofocus: true,
  },
  argTypes: {
    placeholder: { control: "text" },
    autofocus: { control: "boolean" },
    close: { control: "boolean" },
    back: { control: "boolean" },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    virtualize: { control: "boolean" },
    preserveGroupOrder: { control: "boolean" },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    groups: [
      {
        id: "actions",
        label: "Actions",
        items: sampleItems,
      },
    ],
  },
};

export const WithMultipleGroups: Story = {
  args: {
    groups: sampleGroups,
  },
};

export const WithCloseButton: Story = {
  args: {
    groups: sampleGroups,
    close: true,
  },
};

export const WithPrefixAndSuffix: Story = {
  args: {
    groups: [
      {
        id: "files",
        label: "Files",
        items: [
          { label: "app.vue", prefix: "src/", suffix: ".vue", icon: "📄" },
          { label: "main", prefix: "src/", suffix: ".ts", icon: "📄" },
          { label: "index", prefix: "src/components/", suffix: ".vue", icon: "📄" },
        ],
      },
    ],
  },
};

export const WithKbds: Story = {
  args: {
    groups: [
      {
        id: "shortcuts",
        label: "Keyboard Shortcuts",
        items: [
          { label: "Copy", icon: "📋", kbds: ["⌘", "C"] },
          { label: "Paste", icon: "📋", kbds: ["⌘", "V"] },
          { label: "Cut", icon: "✂️", kbds: ["⌘", "X"] },
          { label: "Undo", icon: "↩️", kbds: ["⌘", "Z"] },
          { label: "Redo", icon: "↪️", kbds: ["⌘", "⇧", "Z"] },
        ],
      },
    ],
  },
};

export const WithDescriptions: Story = {
  args: {
    groups: [
      {
        id: "commands",
        label: "Commands",
        items: [
          { label: "Build Project", icon: "🔨", description: "Compile and bundle the project", kbds: ["⌘", "B"] },
          { label: "Run Tests", icon: "🧪", description: "Execute the test suite", kbds: ["⌘", "T"] },
          { label: "Deploy", icon: "🚀", description: "Deploy to production environment" },
          { label: "Lint Code", icon: "🧹", description: "Run the linter on all files", kbds: ["⌘", "L"] },
        ],
      },
    ],
  },
};

export const WithDisabledItems: Story = {
  args: {
    groups: [
      {
        id: "mixed",
        label: "Actions",
        items: [
          { label: "Available Action", icon: "✅", kbds: ["⌘", "A"] },
          { label: "Disabled Action", icon: "🚫", disabled: true, description: "This action is not available" },
          { label: "Another Available", icon: "✅", kbds: ["⌘", "B"] },
          { label: "Also Disabled", icon: "🚫", disabled: true },
        ],
      },
    ],
  },
};

export const WithLoadingItems: Story = {
  args: {
    groups: [
      {
        id: "loading",
        label: "Commands",
        items: [
          { label: "Loaded Item", icon: "✅", description: "Data fetched successfully" },
          { label: "Loading Item...", loading: true, description: "Fetching data..." },
          { label: "Another Loaded", icon: "✅", kbds: ["⌘", "K"] },
          { label: "Also Loading...", loading: true },
        ],
      },
    ],
  },
};

export const LoadingState: Story = {
  args: {
    groups: sampleGroups,
    loading: true,
  },
};

export const WithNestedChildren: Story = {
  args: {
    groups: nestedGroups,
  },
};

export const WithCustomPlaceholder: Story = {
  args: {
    groups: sampleGroups,
    placeholder: "Search commands, files, and more...",
  },
};

export const PreserveGroupOrder: Story = {
  args: {
    groups: [
      {
        id: "recent",
        label: "Recent",
        items: [
          { label: "File A", icon: "📄" },
          { label: "File B", icon: "📄" },
        ],
      },
      {
        id: "actions",
        label: "Actions",
        items: [
          { label: "Save", icon: "💾", kbds: ["⌘", "S"] },
          { label: "Open", icon: "📁", kbds: ["⌘", "O"] },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        items: [
          { label: "Preferences", icon: "⚙️" },
          { label: "Keybindings", icon: "⌨️" },
        ],
      },
    ],
    preserveGroupOrder: true,
  },
};

export const Virtualized: Story = {
  args: {
    groups: largeGroups,
    virtualize: true,
  },
};

export const Disabled: Story = {
  args: {
    groups: sampleGroups,
    disabled: true,
  },
};

export const CustomEmptySlot: Story = {
  render: args => ({
    components: { CommandPalette },
    setup() {
      return { args };
    },
    template: `
      <CommandPalette v-bind="args">
        <template #empty="{ searchTerm }">
          <div class="py-6 px-3 text-center">
            <div class="text-2xl mb-2">🔍</div>
            <div class="font-semibold mb-1">No results found</div>
            <div class="opacity-50 text-xs">
              {{ searchTerm ? \`No matches for "\${searchTerm}"\` : 'Try a different search term' }}
            </div>
          </div>
        </template>
      </CommandPalette>
    `,
  }),
  args: {
    groups: [
      {
        id: "only",
        label: "Items",
        items: [{ label: "Only Item", icon: "📌" }],
      },
    ],
  },
};

export const CustomItemSlot: Story = {
  render: args => ({
    components: { CommandPalette },
    setup() {
      return { args };
    },
    template: `
      <CommandPalette v-bind="args">
        <template #item-leading="{ item }">
          <span class="w-6 h-6 rounded-md flex items-center justify-center text-[13px] flex-shrink-0" bg="black/[0.06]">
            {{ item.icon || '📦' }}
          </span>
        </template>
        <template #item-trailing="{ item }">
          <span class="text-[11px] opacity-40 px-1.5 py-0.5 rounded-full" bg="black/[0.04]">
            {{ item.kbds?.join('+') || '→' }}
          </span>
        </template>
      </CommandPalette>
    `,
  }),
  args: {
    groups: sampleGroups,
  },
};

export const WithFooter: Story = {
  render: args => ({
    components: { CommandPalette },
    setup() {
      return { args };
    },
    template: `
      <CommandPalette v-bind="args">
        <template #footer>
          <div class="flex gap-4 text-[11px] opacity-45">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>esc Close</span>
            <span>⌫ Back</span>
          </div>
        </template>
      </CommandPalette>
    `,
  }),
  args: {
    groups: sampleGroups,
  },
};
