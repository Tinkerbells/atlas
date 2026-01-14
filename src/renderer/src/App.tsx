import type { Component } from 'solid-js'

import { createSignal, onCleanup, onMount } from 'solid-js'

import type { IContextKey } from './common/helpers/context/context'

import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { commandsRegistry } from './common/keybindings/commands'
import { ContextKeyService } from './common/helpers/context/context'
import { CommandService } from './common/keybindings/commands.service'
import { ContextKeyExpression } from './common/helpers/context/parser'
import { keybindingsRegistry } from './common/keybindings/keybindings.registry'
import { StandaloneKeybindingService } from './common/keybindings/keybindings.service'

const HoverKeybindingDemo: Component<{ contextKeyService: ContextKeyService }> = (props) => {
  const [isHovering, setIsHovering] = createSignal(false)
  const [editMode, setEditMode] = createSignal(false)

  let scopedService: ReturnType<ContextKeyService['createScoped']> | undefined
  let hoverCtx: IContextKey<boolean> | undefined
  let editCtx: IContextKey<boolean> | undefined
  let targetRef: HTMLDivElement | undefined

  onMount(() => {
    if (!targetRef)
      return
    scopedService = props.contextKeyService.createScoped(targetRef)
    hoverCtx = scopedService.createKey<boolean>('demo.hovered', false)
    editCtx = scopedService.createKey<boolean>('demo.editMode', false)
  })

  onCleanup(() => scopedService?.dispose())

  const updateHover = (value: boolean) => {
    setIsHovering(value)
    hoverCtx?.set(value)
  }

  const handleEnter = () => {
    updateHover(true)
    targetRef?.focus()
  }

  const handleLeave = () => {
    updateHover(false)
    targetRef?.blur()
  }

  const toggleEditMode = () => {
    const next = !editMode()
    setEditMode(next)
    editCtx?.set(next)
  }

  return (
    <div
      class="hover-demo"
      ref={targetRef}
      tabIndex={0}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div class="hover-demo__title">Hover to enable scoped keybindings</div>
      <p class="hover-demo__desc">
        While this card is hovered and focused, try pressing your keybindings:
      </p>
      <ul class="hover-demo__list">
        <li>⌘C → fileManager.copy (requires hover)</li>
        <li>Ctrl+S → fileManager.save (requires hover + edit mode)</li>
        <li>Ctrl+S, then Q → app.quit (requires hover, disabled in edit mode)</li>
      </ul>
      <div class="hover-demo__state">
        <span class={`pill ${isHovering() ? 'pill--on' : ''}`}>
          Hover:
          {' '}
          {isHovering() ? 'active' : 'off'}
        </span>
        <span class={`pill ${editMode() ? 'pill--on' : ''}`}>
          Edit mode:
          {' '}
          {editMode() ? 'on' : 'off'}
        </span>
      </div>
      <button class="hover-demo__button" type="button" onClick={toggleEditMode}>
        Toggle edit mode
      </button>
      <div class="hover-demo__hint">
        Context keys set: demo.hovered =
        {' '}
        {String(isHovering())}
        , demo.editMode =
        {' '}
        {String(editMode())}
      </div>
    </div>
  )
}

const App: Component = () => {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const commandService = new CommandService()
  const contextKeyService = new ContextKeyService()
  const keybindingService = new StandaloneKeybindingService(contextKeyService, commandService)

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
    keybinding: ['meta+KeyC'],
    weight: 100,
    when: undefined,
  })

  keybindingsRegistry.registerKeybindingRule({
    id: 'fileManager.save',
    keybinding: ['ctrl+KeyS'],
    weight: 100,
    when: ContextKeyExpression.parse('demo.hovered && demo.editMode'),
  })

  keybindingsRegistry.registerKeybindingRule({
    id: 'app.quit',
    keybinding: ['ctrl+KeyS', 'KeyQ'],
    weight: 200,
    when: ContextKeyExpression.parse('demo.hovered && !demo.editMode'),
  })

  onCleanup(() => {
    commandService.dispose()
    keybindingService.dispose()
    contextKeyService.dispose()
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
      <HoverKeybindingDemo contextKeyService={contextKeyService} />
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
