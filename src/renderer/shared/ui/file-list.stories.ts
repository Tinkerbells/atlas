import type { Meta, StoryObj } from "@storybook/vue3-vite";

import type { FileListEntry } from "./file-list.vue";

import FileList from "./file-list.vue";

const meta = {
  title: "UI/FileList",
  component: FileList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FileList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockFiles: FileListEntry[] = [
  { id: "1", name: "README.md", isDirectory: false, isSymbolicLink: false },
  { id: "2", name: "package.json", isDirectory: false, isSymbolicLink: false },
  { id: "3", name: "tsconfig.json", isDirectory: false, isSymbolicLink: false },
];

const mockDirectories: FileListEntry[] = [
  { id: "1", name: "src", isDirectory: true, isSymbolicLink: false },
  { id: "2", name: "docs", isDirectory: true, isSymbolicLink: false },
  { id: "3", name: "tests", isDirectory: true, isSymbolicLink: false },
];

const mockMixed: FileListEntry[] = [
  { id: "1", name: "src", isDirectory: true, isSymbolicLink: false },
  { id: "2", name: "README.md", isDirectory: false, isSymbolicLink: false },
  { id: "3", name: "package.json", isDirectory: false, isSymbolicLink: false },
  { id: "4", name: "node_modules", isDirectory: true, isSymbolicLink: true },
  { id: "5", name: "LICENSE", isDirectory: false, isSymbolicLink: false },
];

export const Default: Story = {
  args: {
    entries: mockFiles,
    loading: false,
    error: null,
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};

export const Loading: Story = {
  args: {
    entries: [],
    loading: true,
    error: null,
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};

export const Error: Story = {
  args: {
    entries: [],
    loading: false,
    error: "Permission denied: /root",
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};

export const Empty: Story = {
  args: {
    entries: [],
    loading: false,
    error: null,
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};

export const EmptyCustomMessage: Story = {
  args: {
    entries: [],
    loading: false,
    error: null,
    emptyMessage: "No files in this directory",
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};

export const WithFiles: Story = {
  args: {
    entries: mockFiles,
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};

export const WithDirectories: Story = {
  args: {
    entries: mockDirectories,
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};

export const WithMixedContent: Story = {
  args: {
    entries: mockMixed,
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};

export const WithSymlinks: Story = {
  args: {
    entries: [
      { id: "1", name: "node_modules", isDirectory: true, isSymbolicLink: true },
      { id: "2", name: "config.local", isDirectory: false, isSymbolicLink: true },
    ],
  },
  decorators: [
    () => ({
      template: "<div class=\"w-80 h-96 border rounded\"><story /></div>",
    }),
  ],
};
