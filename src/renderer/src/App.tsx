import type { Component } from 'solid-js'

import { XIcon } from 'lucide-solid'
import { Portal } from 'solid-js/web'
import { onCleanup, onMount } from 'solid-js'

import { Dialog } from './components/dialog'
import { commandRegistry } from './common/keybindnigs/commands'
import { keybindingRegistry } from './common/keybindnigs/keybindings'
import { KeybindingService } from './common/keybindnigs/keybindings.service'

const App: Component = () => {
  const kbService = new KeybindingService()
  onMount(() => {
    const disposeSave = commandRegistry.register('file.save', () => {
      console.log('SAVING FILE...')
    })

    const disposeDelete = commandRegistry.register('file.delete', () => {
      console.log('DELETING FILE...')
    })

    const disposeBindSave = keybindingRegistry.register({
      key: 'Ctrl+S',
      commandId: 'file.save',
    })

    const disposeBindDelete = keybindingRegistry.register({
      key: 'Delete',
      commandId: 'file.delete',
      when: 'fileListFocus',
    })

    onCleanup(() => {
      disposeSave()
      disposeDelete()
      disposeBindSave()
      disposeBindDelete()
    })
  })

  onCleanup(() => {
    kbService.dispose()
  })

  return (
    <>
      <Dialog.Root defaultOpen>
        <Dialog.Trigger>Open Dialog</Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>Dialog Title</Dialog.Title>
              <Dialog.Description>Dialog Description</Dialog.Description>
              <Dialog.CloseTrigger>
                <XIcon />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

export default App
