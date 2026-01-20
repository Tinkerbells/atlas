import type { Component } from 'solid-js'

import { onCleanup } from 'solid-js'

import { ContextKeyService } from './common/context/context'
import { DisposableStore } from './common/lifecycle/dispose'
import { CommandService, commandsRegistry } from './common/commands'
import { BrowserKeyboardLayoutService, KeybindingService, keybindingsRegistry } from './common/keybindings'

const App: Component = () => {
  const store = new DisposableStore()
  const cks = store.add(new ContextKeyService())
  const cs = store.add(new CommandService())
  const kls = store.add(new BrowserKeyboardLayoutService())
  store.add(new KeybindingService(cks, cs, kls))

  store.add(commandsRegistry.registerCommand('demo.sayHello1', () => console.log('Hello World!')))

  store.add(keybindingsRegistry.registerKeybindingRule({
    id: 'demo.sayHello1',
    weight: 100,
    when: undefined,
    primary: 'ctrl+KeyC ctrl+KeyF',
    mac: {
      primary: 'meta+KeyC ctrl+KeyF',
    },
  }))

  onCleanup(() => {
    store.dispose()
  })

  return (
    <div>app shell</div>
  )
}

export default App
