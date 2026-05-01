import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { ref } from "vue";
import { Button } from "~/shared/ui/button";

import { Modal } from "./index";

const meta = {
  title: "Shared/UI/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    overlay: { control: "boolean" },
    scrollable: { control: "boolean" },
    transition: { control: "boolean" },
    fullscreen: { control: "boolean" },
    portal: { control: "boolean" },
    close: { control: "boolean" },
    closeIcon: { control: "text" },
    dismissible: { control: "boolean" },
    modal: { control: "boolean" },
    open: { control: "boolean" },
    defaultOpen: { control: "boolean" },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This is the modal body content.</p>
        </template>
      </Modal>
    `,
  }),
};

export const WithTitle: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This modal has a title in the header.</p>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "Modal Title",
  },
};

export const WithDescription: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This modal has both a title and a description.</p>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "Modal with Description",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
};

export const WithFooterSlot: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This modal includes a footer with action buttons.</p>
        </template>

        <template #footer="{ close }">
          <div class="flex gap-2 justify-end">
            <Button variant="outline" color="neutral" label="Cancel" @click="close" />
            <Button label="Submit" />
          </div>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "Modal with Footer",
    description: "This is useful when you want a form in a Modal.",
  },
};

export const WithCustomContentSlot: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #content="{ close }">
          <div class="p-6 bg-white rounded-lg shadow-lg">
            <h3 class="text-lg font-semibold mb-2">Custom Content</h3>
            <p class="text-gray-700 mb-4">Using the content slot gives full control over the modal layout.</p>
            <Button label="Close" @click="close" />
          </div>
        </template>
      </Modal>
    `,
  }),
};

export const WithoutOverlay: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This modal has no overlay behind it.</p>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "No Overlay",
    overlay: false,
  },
};

export const WithoutTransition: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This modal opens without animation.</p>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "No Transition",
    transition: false,
  },
};

export const NonDismissible: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This modal cannot be closed by clicking outside or pressing Escape.</p>
          <p class="text-gray-500 text-sm mt-2">Use the close button to dismiss it.</p>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "Non-Dismissible",
    dismissible: false,
  },
};

export const Fullscreen: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Fullscreen" />

        <template #body>
          <p class="text-gray-700">This modal takes up the entire screen.</p>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "Fullscreen Modal",
    fullscreen: true,
  },
  parameters: {
    layout: "fullscreen",
  },
};

export const Scrollable: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Scrollable" />

        <template #body>
          <div class="space-y-4">
            <p v-for="i in 20" :key="i" class="text-gray-700">
              Scrollable content line {{ i }}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "Scrollable Modal",
    scrollable: true,
    overlay: true,
  },
};

export const CustomCloseIcon: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This modal uses a custom close icon.</p>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "Custom Close Icon",
    closeIcon: "lucide:arrow-right",
  },
};

export const WithoutCloseButton: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #body>
          <p class="text-gray-700">This modal has no close button in the header.</p>
          <p class="text-gray-500 text-sm mt-2">Click outside or press Escape to close.</p>
        </template>
      </Modal>
    `,
  }),
  args: {
    title: "No Close Button",
    close: false,
  },
};

export const NonModal: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <div class="space-y-4">
        <p class="text-gray-700">When modal is false, interaction with outside content is allowed.</p>
        <Modal v-bind="args">
          <Button label="Open Non-Modal" />

          <template #body>
            <p class="text-gray-700">You can interact with elements behind this dialog.</p>
          </template>
        </Modal>
        <Button variant="outline" label="Outside Button" />
      </div>
    `,
  }),
  args: {
    title: "Non-Modal Dialog",
    modal: false,
  },
};

export const ControlOpenState: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="space-y-4">
        <Button label="Open Controlled" @click="open = true" />
        <span class="text-sm text-gray-500">Open state: {{ open }}</span>

        <Modal v-bind="args" v-model:open="open">
          <template #body>
            <p class="text-gray-700">This modal's open state is controlled externally.</p>
          </template>

          <template #footer="{ close }">
            <div class="flex gap-2 justify-end">
              <Button variant="outline" color="neutral" label="Close via state" @click="open = false" />
              <Button label="Close via slot prop" @click="close" />
            </div>
          </template>
        </Modal>
      </div>
    `,
  }),
  args: {
    title: "Controlled Open State",
  },
};

export const WithCustomHeader: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #header="{ close }">
          <div class="flex items-center justify-between w-full p-4 bg-gray-100 rounded-t-lg">
            <span class="font-bold text-lg">Custom Header</span>
            <Button variant="ghost" color="neutral" square icon="lucide:x" aria-label="Close" @click="close" />
          </div>
        </template>

        <template #body>
          <p class="text-gray-700">This modal uses a custom header slot.</p>
        </template>
      </Modal>
    `,
  }),
};

export const WithTitleAndDescriptionSlots: Story = {
  render: args => ({
    components: { Modal, Button },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <Button label="Open Modal" />

        <template #title>
          <span class="text-red-500 font-bold">Custom Title Slot</span>
        </template>

        <template #description>
          <span class="text-blue-500 italic">Custom description slot content.</span>
        </template>

        <template #body>
          <p class="text-gray-700">This modal uses title and description slots.</p>
        </template>
      </Modal>
    `,
  }),
};
