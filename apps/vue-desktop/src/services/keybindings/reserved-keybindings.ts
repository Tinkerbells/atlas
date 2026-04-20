/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const RESERVED_BROWSER_KEYBINDINGS: string[] = [
  'ctrl+r',
  'ctrl+t',
  'ctrl+w',
  'ctrl+l',
  'ctrl+d',
  'ctrl+f',
  'ctrl+g',
  'ctrl+shift+f',
  'ctrl+shift+r',
  'ctrl+shift+t',
  'shift+ctrl+r',
  'alt+ctrl+r',
  'cmd+r',
  'cmd+t',
  'cmd+w',
  'cmd+l',
  'cmd+d',
  'cmd+f',
  'cmd+g',
  'cmd+shift+f',
  'cmd+shift+r',
];

export function isReservedBrowserKeybinding(keybindingStr: string): boolean {
  return RESERVED_BROWSER_KEYBINDINGS.includes(keybindingStr.toLowerCase());
}
