import type { Component } from 'solid-js'

import { onCleanup } from 'solid-js'

import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { commandsRegistry } from './common/keybindings/commands'
import { CommandService } from './common/keybindings/commands.service'
import { keybindingsRegistry } from './common/keybindings/keybindings.registry'
import { StandaloneKeybindingService } from './common/keybindings/keybindings.service'

const App: Component = () => {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const commandService = new CommandService()
  const keybindingService = new StandaloneKeybindingService(commandService)

  commandsRegistry.registerCommand('fileManager.copy', () => {
    console.log('LOGIC: Files copied to clipboard!')
  })

  commandsRegistry.registerCommand('fileManager.save', () => {
    console.log('LOGIC: File saved!')
  })

  commandsRegistry.registerCommand('app.quit', () => {
    console.log('LOGIC: Quitting application...')
  })

  keybindingsRegistry.registerKeybindingRule({
    id: 'fileManager.copy',
    keybinding: ['ctrl+KeyC'],
    weight: 100,
    when: null,
  })

  keybindingsRegistry.registerKeybindingRule({
    id: 'fileManager.save',
    keybinding: ['ctrl+KeyS'],
    weight: 100,
    when: null,
  })

  keybindingsRegistry.registerKeybindingRule({
    id: 'app.quit',
    keybinding: ['ctrl+KeyK', 'KeyQ'],
    weight: 200,
    when: null,
  })

  onCleanup(() => {
    commandService.dispose()
    keybindingService.dispose()
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
