# AGENTS.md

## Overview

This is a SolidJS component library with TypeScript, SCSS, and Storybook. Follow these rules when creating or modifying components.

## Component File Structure

Each component directory must contain these files:

```
component-name/
  ├── component-name.tsx          # Main component file
  ├── component-name.styles.scss  # Component styles
  ├── component-name.stories.tsx  # Storybook stories
  └── index.ts                    # Component export
```

Export the component in `src/index.ts`:

```typescript
export * from './component-name'
```

## TypeScript/SolidJS Patterns

### Import Order

```typescript
import './component-name.styles.scss'
import type { ComponentProps, JSX } from 'solid-js'

import { mergeProps, Show, splitProps } from 'solid-js'

import { Ripple } from '@/ripple'
import { block } from '@/utils/bem'
```

### Props Definition

Separate props into base and custom interfaces, then combine:

```typescript
interface ComponentCustomProps {
  variant?: 'default' | 'primary'
  size?: 'normal' | 'small'
}

type BaseComponentProps = ComponentProps<'button'>

export interface ComponentProps extends BaseComponentProps, ComponentCustomProps { }
```

Use JSDoc comments with default values:

```typescript
interface ComponentCustomProps {
  /**
   * The visual style of the component.
   * @default "default"
   */
  variant?: 'default' | 'primary'
}
```

### Component Implementation

Use `mergeProps` for defaults and `splitProps` for prop separation:

```typescript
const b = block('component-name')

export function Component(props: ComponentProps) {
  const merged = mergeProps(
    {
      variant: 'default',
      size: 'normal',
    },
    props,
  )

  const [local, rest] = splitProps(merged, [
    'variant',
    'size',
    'children',
    'class',
  ])

  return (
    <button
      class={b(
        {
          [local.size]: true,
          [local.variant]: true,
        },
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </button>
  )
}
```

## BEM Methodology

Use `@bem-react/classname` utility:

```typescript
import { block } from '@/utils/bem'
const b = block('component-name')
```

Generate classes with modifiers:

```typescript
class={b(
  {
    modifier: true,
    'compound-modifier': true,
  },
  local.class,
)}
```

CSS output: `atlas-component-name--modifier`

Namespace: `atlas-`

Element pattern: `__element` → `atlas-component-name__element`

## SCSS/CSS Patterns

### Import and Block Definition

```scss
@use '@styles/variables';

$block: '.#{variables.$ns}component-name';
```

### CSS Variables

Define all component variables in `:root`:

```scss
:root {
  --component-name-property: value;
  --component-name-size: 16px;
  --component-name-color: var(--color-primary);
}
```

Naming convention: `--component-name-property` (kebab-case)

### Styling

Use `#{$block}` for the main selector:

```scss
#{$block} {
  position: relative;
  display: flex;

  &__element {
    // element styles
  }

  &--modifier {
    // modifier styles
  }
}
```

Use CSS variables for all stylable properties.

## Storybook Patterns

### Basic Structure

```typescript
import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Component } from './component'

const meta: Meta<typeof Component> = {
  title: 'Components/ComponentName',
  component: Component,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary'],
    },
  },
}

export default meta

type Story = StoryObj<typeof Component>

export const Base: Story = {
  args: {
    variant: 'default',
    size: 'normal',
  },
}
```

### Render Examples

```typescript
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '10px' }}>
      <Component variant="default">Default</Component>
      <Component variant="primary">Primary</Component>
    </div>
  ),
}
```

Add JSDoc comments to stories:

```typescript
/**
 * All component variants
 */
export const Variants: Story = { ... }
```

## Theming

### Component Variables

Create `themes/md3-light/component-name.ts` and `themes/md3-dark/component-name.ts`:

```typescript
export default {
  '--component-name-color': 'var(--color-primary)',
  '--component-name-size': '16px',
}
```

### Theme Integration

Import component variables in main theme file `themes/md3-light/index.ts`:

```typescript
import component from './component'

export default {
  // ... other theme vars
  ...component,
} as StyleVars
```

Use theme CSS variables in component styles.

## Export Component

Component directory `index.ts`:

```typescript
export * from './component'
```

Main `src/index.ts`:

```typescript
export * from './component-name'
```

## Commit Conventions

All commits must follow Conventional Commits specification with these rules:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Rules

- **Header max length**: 120 characters
- **Subject**: cannot be empty, must not end with `.`
- **Body**: must start with a blank line
- **Footer**: must start with a blank line
- **Type**: must be lowercase, cannot be empty

### Allowed Types

- `feat` - New feature
- `bug` - Bug fix
- `wip` - Work in progress
- `refactor` - Code refactoring
- `doc` - Documentation changes
- `build` - Build system changes
- `chore` - Maintenance tasks
- `revert` - Revert previous commit
- `style` - Code style changes
- `test` - Test additions/changes
- `major` - Major version changes
- `story` - Story-related changes

### Examples

```
feat(button): add loading state support

Implement loading spinner when loading prop is set to true.

Closes #123
```

```
bug(input): fix focus management on mobile devices

```

```
refactor(component): simplify props handling
```

## General Rules

### Naming Conventions

- Files: `component-name.tsx`, `component-name.styles.scss` (kebab-case)
- Components: `ComponentName` (PascalCase)
- CSS variables: `--component-name-property` (kebab-case)

### Comments

- Add JSDoc comments to all public interfaces
- Use `// TODO` for temporary solutions

### TypeScript

- All components must use TypeScript
- Define types for all props

## Linting and Type Checking

Run these commands to verify code quality:

```bash
npm run lint          # Check code style
npm run lint:fix      # Fix linting issues
npm run typecheck     # Check TypeScript types
```
