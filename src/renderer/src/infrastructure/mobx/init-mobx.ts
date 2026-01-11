import { Reaction } from 'mobx'
import { enableExternalSource } from 'solid-js'

let isInitialized = false

export function initMobxObserver() {
  // Защита от повторной инициализации
  if (isInitialized) {
    return
  }

  let id = 0

  enableExternalSource((fn, trigger) => {
    // Создаем MobX Reaction, которая будет дергать trigger при изменении данных
    const reaction = new Reaction(`mobx-solid-bridge@${++id}`, trigger)

    return {
      track: (x) => {
        let next
        // Запускаем функцию внутри reaction.track, чтобы MobX запомнил зависимости
        reaction.track(() => (next = fn(x)))
        return next
      },
      dispose: () => {
        reaction.dispose()
      },
    }
  })

  isInitialized = true
}
