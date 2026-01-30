/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export { ScanCode } from './scan-code';

export * from './keybindings-registry';
export * from './keybindings.service';

export {
  Keybinding,
  ScanCodeChord as KeyCodeChord,
  decodeKeybinding,
  type Chord,
} from './keybindings';
