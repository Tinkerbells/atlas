import type { Meta, StoryObj } from "@storybook/vue3-vite";

import FsNavigator from "./fs-navigator.vue";

const meta = {
  title: "UI/Demos/FsNavigator",
  component: FsNavigator,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FsNavigator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Root: Story = {
  args: {
    initialPath: "/",
  },
};

export const HomeDir: Story = {
  args: {
    initialPath: "/home/voiduser",
  },
};

export const ProjectDir: Story = {
  args: {
    initialPath: "/home/voiduser/projects/atlas",
  },
};

export const EmptyDir: Story = {
  args: {
    initialPath: "/home/voiduser/empty",
  },
};
