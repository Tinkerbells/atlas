import type { Component } from 'solid-js'

import { onCleanup, onMount } from 'solid-js'

import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { commandRegistry } from './common/keybindnigs/commands'
import { keybindingRegistry } from './common/keybindnigs/keybindings'
import { KeybindingService } from './common/keybindnigs/keybindings.service'

const App: Component = () => {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

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
      <img alt="logo" class="logo" src={electronLogo} />
      <div class="creator">Powered by electron-vite</div>
      <div class="text">
        Build an Electron app with
        {' '}
        <span class="solid">Solid</span>
        &nbsp;and
        {' '}
        <span class="ts">TypeScript</span>
      </div>
      <p class="tip">
        Please try pressing
        {' '}
        <code>F12</code>
        {' '}
        to open the devTool
      </p>
      <div class="actions">
        <div class="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div class="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions />
    </>
  )
}

export default App
