import { SimpleResolvedKeybinding } from './simple-resolved-keybinding'

export class KeyboardLayoutUtils {
  public static resolveKeyboardEvent(e: KeyboardEvent): SimpleResolvedKeybinding {
    // 1. Если это просто нажатие модификатора (ctrl, shift...) — это не аккорд
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      // Возвращаем пустой биндинг или null (зависит от того, как обработает диспетчер)
      // VS Code тут возвращает спец. объект, но мы упростим:
      return new SimpleResolvedKeybinding([])
    }

    const parts: string[] = []

    // 2. Строим строку в строгом порядке
    if (e.ctrlKey)
      parts.push('ctrl')
    if (e.shiftKey)
      parts.push('shift')
    if (e.altKey)
      parts.push('alt')
    if (e.metaKey)
      parts.push('meta')

    // 3. Добавляем код клавиши
    // Используем e.code (KeyS, Digit1, Enter), так как это физическая клавиша
    // Это надежнее для шорткатов, чем e.key
    parts.push(e.code)

    const chord = parts.join('+') // "ctrl+KeyS"

    return new SimpleResolvedKeybinding([chord])
  }
}
