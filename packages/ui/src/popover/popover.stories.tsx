import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { For } from 'solid-js'
import { X } from 'lucide-solid'
import { Portal } from 'solid-js/web'

import { Button } from '../button'
import { Popover } from './popover'
import { IconButton } from '../icon-button'

interface PopoverStoryArgs {
  defaultOpen?: boolean
  lazyMount?: boolean
  unmountOnExit?: boolean
  closeOnInteractOutside?: boolean
  closeOnEscape?: boolean
}

/**
 * Popover - всплывающая панель с дополнительным контентом.
 *
 * Компонент следует Material Design 3 принципам и использует ark-ui для управления состоянием.
 * Поддерживает позиционирование, стрелки, вложенность и управление фокусом.
 */
const meta = {
  title: 'Components/Popover',
  component: Popover.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Начальное состояние при монтировании',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    lazyMount: {
      control: 'boolean',
      description: 'Ленивая загрузка содержимого (рендер только при открытии)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    unmountOnExit: {
      control: 'boolean',
      description: 'Размонтировать содержимое при закрытии',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    closeOnInteractOutside: {
      control: 'boolean',
      description: 'Закрывать при клике вне попапа',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Закрывать при нажатии Escape',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
  },
  args: {
    defaultOpen: false,
    lazyMount: false,
    unmountOnExit: false,
    closeOnInteractOutside: true,
    closeOnEscape: true,
  },
} satisfies Meta<PopoverStoryArgs>

export default meta
type Story = StoryObj<PopoverStoryArgs>

/**
 * Базовая история с полным набором компонентов и пропсов по умолчанию.
 * Показывает стандартное использование Popover с заголовком, описанием и кнопкой закрытия.
 */
export const Base: Story = {
  render: args => (
    <Popover.Root
      portalled={false}
      defaultOpen={args.defaultOpen}
      lazyMount={args.lazyMount}
      unmountOnExit={args.unmountOnExit}
      closeOnInteractOutside={args.closeOnInteractOutside}
      closeOnEscape={args.closeOnEscape}
    >
      <Popover.Trigger asChild={props => <Button {...props()}>Открыть Popover</Button>} />
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Arrow />
            <Popover.Body>
              <Popover.Title>Заголовок</Popover.Title>
              <Popover.Description>
                Popover используется для отображения дополнительного контента,
                подсказок или действий, связанных с элементом.
              </Popover.Description>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  ),
}

/**
 * Popover с Header, Body и Footer структурой.
 * Использует все доступные секции для более сложной компоновки.
 */
export const WithSections: Story = {
  render: args => (
    <Popover.Root
      portalled={false}
      defaultOpen={args.defaultOpen}
      lazyMount={args.lazyMount}
      unmountOnExit={args.unmountOnExit}
      closeOnInteractOutside={args.closeOnInteractOutside}
      closeOnEscape={args.closeOnEscape}
    >
      <Popover.Trigger asChild={props => <Button {...props()}>Открыть с секциями</Button>} />
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Arrow />
            <Popover.Header>
              <Popover.Title>Сохранить настройки?</Popover.Title>
            </Popover.Header>
            <Popover.Body>
              <Popover.Description>
                Эти настройки будут сохранены и применены при следующем запуске.
              </Popover.Description>
            </Popover.Body>
            <Popover.Footer>
              <Popover.CloseTrigger asChild={props => <Button {...props()} variant="text">Отмена</Button>} />
              <Button variant="filled">Сохранить</Button>
            </Popover.Footer>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  ),
}

/**
 * Popover с кнопкой закрытия.
 * Демонстрирует использование CloseTrigger для явного закрытия.
 */
export const WithCloseTrigger: Story = {
  render: args => (
    <Popover.Root
      portalled={false}
      defaultOpen={args.defaultOpen}
      lazyMount={args.lazyMount}
      unmountOnExit={args.unmountOnExit}
      closeOnInteractOutside={args.closeOnInteractOutside}
      closeOnEscape={args.closeOnEscape}
    >
      <Popover.Trigger asChild={props => <Button {...props()}>Вовлеченность</Button>} />
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Arrow />
            <Popover.Body>
              <Popover.Title>Вовлеченность пользователей</Popover.Title>
              <Popover.Description>
                Popover отлично подходят для отображения дополнительного контекста
                и подтверждений действий.
              </Popover.Description>
            </Popover.Body>
            <Popover.Footer>
              <Popover.CloseTrigger asChild={props => <Button {...props()} variant="text">Закрыть</Button>} />
            </Popover.Footer>
            <Popover.CloseTrigger asChild={props => <IconButton {...props()} aria-label="Close popover"><X /></IconButton>} />
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  ),
}

/**
 * Открытый по умолчанию Popover.
 * Полезно для демонстрации или при необходимости показать важную информацию сразу.
 */
export const DefaultOpen: Story = {
  args: {
    defaultOpen: true,
  },
  render: args => (
    <Popover.Root
      portalled={false}
      defaultOpen={args.defaultOpen}
      lazyMount={args.lazyMount}
      unmountOnExit={args.unmountOnExit}
      closeOnInteractOutside={args.closeOnInteractOutside}
      closeOnEscape={args.closeOnEscape}
    >
      <Popover.Trigger asChild={props => <Button {...props()}>Триггер</Button>} />
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Arrow />
            <Popover.Body>
              <Popover.Title>Открыт по умолчанию</Popover.Title>
              <Popover.Description>
                Этот popover открыт сразу при монтировании компонента.
              </Popover.Description>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  ),
}

/**
 * Popover с разными позициями размещения.
 * Демонстрирует возможности позиционирования относительно триггера.
 */
export const Placement: Story = {
  render: args => (
    <div style={{
      'display': 'grid',
      'grid-template-columns': 'repeat(3, 1fr)',
      'gap': '120px',
      'padding': '120px',
    }}
    >
      <For each={['top', 'right', 'bottom', 'left'] as const}>
        {placement => (
          <Popover.Root
            portalled={false}
            defaultOpen={args.defaultOpen}
            lazyMount={args.lazyMount}
            unmountOnExit={args.unmountOnExit}
            closeOnInteractOutside={args.closeOnInteractOutside}
            closeOnEscape={args.closeOnEscape}
            positioning={{ placement }}
          >
            <Popover.Trigger asChild={props => <Button {...props()}>{placement}</Button>} />
            <Portal>
              <Popover.Positioner>
                <Popover.Content>
                  <Popover.Arrow />
                  <Popover.Body>
                    <Popover.Title>
                      Позиция:
                      {placement}
                    </Popover.Title>
                    <Popover.Description>
                      Popover размещен
                      {' '}
                      {placement === 'top' ? 'сверху' : placement === 'bottom' ? 'снизу' : placement === 'left' ? 'слева' : 'справа'}
                      .
                    </Popover.Description>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        )}
      </For>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}

/**
 * Popover без стрелки.
 * Более минималистичный вариант без визуального указателя.
 */
export const WithoutArrow: Story = {
  render: args => (
    <Popover.Root
      portalled={false}
      defaultOpen={args.defaultOpen}
      lazyMount={args.lazyMount}
      unmountOnExit={args.unmountOnExit}
      closeOnInteractOutside={args.closeOnInteractOutside}
      closeOnEscape={args.closeOnEscape}
    >
      <Popover.Trigger asChild={props => <Button {...props()}>Без стрелки</Button>} />
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Body>
              <Popover.Title>Без стрелки</Popover.Title>
              <Popover.Description>
                Этот popover не имеет стрелки-указателя.
              </Popover.Description>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  ),
}

/**
 * Все варианты Popover в одном кадре.
 * Показывает различные комбинации использования компонента.
 */
export const AllVariations: Story = {
  render: () => (
    <div style={{
      'display': 'flex',
      'flex-direction': 'column',
      'gap': '40px',
      'padding': '40px',
      'align-items': 'flex-start',
    }}
    >
      <div>
        <h3 style={{ 'margin': '0 0 16px', 'font-size': '16px', 'font-weight': '500' }}>Базовый</h3>
        <Popover.Root portalled={false}>
          <Popover.Trigger asChild={props => <Button {...props()}>Открыть</Button>} />
          <Portal>
            <Popover.Positioner>
              <Popover.Content>
                <Popover.Arrow />
                <Popover.Body>
                  <Popover.Title>Заголовок</Popover.Title>
                  <Popover.Description>Описание popover</Popover.Description>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      </div>

      <div>
        <h3 style={{ 'margin': '0 0 16px', 'font-size': '16px', 'font-weight': '500' }}>С действиями</h3>
        <Popover.Root portalled={false}>
          <Popover.Trigger asChild={props => <Button {...props()}>Открыть с действиями</Button>} />
          <Portal>
            <Popover.Positioner>
              <Popover.Content>
                <Popover.Arrow />
                <Popover.Body>
                  <Popover.Title>Подтвердите действие</Popover.Title>
                  <Popover.Description>
                    Вы уверены, что хотите продолжить?
                  </Popover.Description>
                </Popover.Body>
                <Popover.Footer>
                  <Popover.CloseTrigger asChild={props => <Button {...props()} variant="text">Отмена</Button>} />
                  <Button variant="filled">Подтвердить</Button>
                </Popover.Footer>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      </div>

      <div>
        <h3 style={{ 'margin': '0 0 16px', 'font-size': '16px', 'font-weight': '500' }}>Без стрелки</h3>
        <Popover.Root portalled={false}>
          <Popover.Trigger asChild={props => <Button {...props()}>Минималистичный</Button>} />
          <Portal>
            <Popover.Positioner>
              <Popover.Content>
                <Popover.Body>
                  <Popover.Title>Без стрелки</Popover.Title>
                  <Popover.Description>
                    Чистый дизайн без дополнительных элементов
                  </Popover.Description>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}
