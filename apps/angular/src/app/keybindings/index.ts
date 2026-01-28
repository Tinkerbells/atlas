export { ScanCode } from './codes';
export type { Modifiers as KeyCodeModifiers } from './codes';
export * from './keybindings-registry';
export * from './keybindings.service';
export {
  Keybinding,
  ScanCodeChord as KeyCodeChord,
  decodeKeybinding,
  type Chord,
} from './keybindings';
