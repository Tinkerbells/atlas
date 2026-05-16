---
name: storybook
description: ""
license: MIT
metadata:
  author: Tinkerbells
  version: "0.0.1"
---

# Storybook - Writing Stories (Vue)

## Key Concepts

### Component Story Format 3 (CSF3)

CSF3 is the modern Storybook format that uses an object-based syntax to describe stories:

```typescript
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Button from "./Button.vue";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    backgroundColor: { control: "color" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    primary: true,
    label: "Button",
  },
};

export const Secondary: Story = {
  args: {
    label: "Button",
  },
};
```

### Story Organization

- **One story per component:** `Component.stories.ts`
- **Use descriptive story names:** `Primary`, `Secondary`, `Large`, `Disabled`
- **Group related stories** using hierarchy in the `title`: `Components/Forms/Input`

### Default Export (Meta)

The default export defines the metadata for all stories in the file:

```typescript
const meta = {
  title: "Components/Button", // Path in the navigation sidebar
  component: Button, // The component reference
  parameters: {}, // Story-level configuration
  tags: ["autodocs"], // Enables automatic documentation
  argTypes: {}, // Control configuration (knobs)
  decorators: [], // Story wrappers
} satisfies Meta<typeof Button>;
```

---

## Best Practices

### 1. Use TypeScript for Strong Typing

```typescript
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Button from "./Button.vue";

const meta = {
  component: Button,
} satisfies Meta<typeof Button>;

type Story = StoryObj<typeof meta>;
```

### 2. Demonstrate All Component States

Create separate stories for every significant state:

```typescript
export const Default: Story = {
  args: {
    label: "Click me",
  },
};

export const Loading: Story = {
  args: {
    label: "Loading...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Inactive",
    disabled: true,
  },
};

export const WithIcon: Story = {
  args: {
    label: "Download",
    icon: "download",
  },
};
```

### 3. Use Sensible Default Values

```typescript
export const Primary: Story = {
  args: {
    primary: true,
    label: "Button",
    size: "medium",
  },
};

// Extending existing stories
export const PrimaryLarge: Story = {
  ...Primary,
  args: {
    ...Primary.args,
    size: "large",
  },
};
```

### 4. Add Descriptive Parameters

```typescript
export const WithTooltip: Story = {
  args: {
    label: "Hover me",
    tooltip: "Click to submit",
  },
  parameters: {
    docs: {
      description: {
        story: "Shows a tooltip on hover to provide additional context.",
      },
    },
  },
};
```

### 5. Use Decorators for Context

In Vue, decorators can return components with templates:

```typescript
import Navigation from "./Navigation.vue";

const meta = {
  component: Navigation,
  decorators: [
    () => ({
      template: '<div style="padding: 3rem;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Navigation>;
```

---

## Common Patterns

### Form Components

```typescript
export const EmptyForm: Story = {
  args: {
    onSubmit: (data: any) => console.log(data),
  },
};

export const PrefilledForm: Story = {
  args: {
    defaultValues: {
      email: "user@example.com",
      name: "John Doe",
    },
  },
};

export const WithValidationErrors: Story = {
  args: {
    errors: {
      email: "Invalid email format",
      name: "Name is required",
    },
  },
};
```

### Layout Components using Slots

For components with slots, use the `render` function:

```typescript
import Layout from "./Layout.vue";
import Sidebar from "./Sidebar.vue";
import Content from "./Content.vue";

export const WithSidebar: Story = {
  render: (args) => ({
    components: { Layout, Sidebar, Content },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <template #sidebar>
          <Sidebar :items="args.sidebarItems" />
        </template>
        <template #default>
          <Content />
        </template>
      </Layout>
    `,
  }),
  parameters: {
    layout: "fullscreen",
  },
};
```

### Data-Driven Components

```typescript
const mockData = [
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
  { id: 3, name: "Item 3" },
];

export const WithData: Story = {
  args: {
    items: mockData,
  },
};

export const Empty: Story = {
  args: {
    items: [],
    emptyMessage: "No items found",
  },
};
```

### Responsive Components

```typescript
export const Mobile: Story = {
  args: {
    variant: "mobile",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const Desktop: Story = {
  args: {
    variant: "desktop",
  },
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
};
```

---

## Anti-patterns

### ❌ Don't use template binding (CSF2)

```typescript
// BAD - Old CSF2 format
const Template = (args) => ({
  components: { Button },
  setup() {
    return { args };
  },
  template: '<Button v-bind="args" />',
});
export const Primary = Template.bind({});
Primary.args = { label: "Button" };
```

```typescript
// GOOD - CSF3 format
export const Primary: Story = {
  args: { label: "Button" },
};
```

### ❌ Don't mix complex logic inside stories

```typescript
// BAD
export const Complex: Story = {
  render: (args) => ({
    components: { Component },
    setup() {
      const state = ref(false);
      onMounted(() => {
        // Complex side effects
      });
      return { args, state };
    },
    template: '<Component v-bind="args" :isActive="state" />',
  }),
};
```

```typescript
// GOOD - Move logic into the component or use play-functions
export const Complex: Story = {
  args: { initialState: false },
};
```

### ❌ Don't hardcode repetitive props

```typescript
// BAD
export const Story1: Story = {
  args: { label: "Button", size: "medium", theme: "light" },
};
export const Story2: Story = {
  args: { label: "Submit", size: "medium", theme: "light" },
};
```

```typescript
// GOOD - Use default values at the meta level
const meta = {
  component: Button,
  args: {
    size: "medium",
    theme: "light",
  },
} satisfies Meta<typeof Button>;

export const Story1: Story = {
  args: { label: "Button" },
};
export const Story2: Story = {
  args: { label: "Submit" },
};
```

### ❌ Don't skip story types

```typescript
// BAD - Missing type annotation
export const Primary = {
  args: { label: "Button" },
};
```

```typescript
// GOOD - Typed
export const Primary: Story = {
  args: { label: "Button" },
};
```

## Related Skills
