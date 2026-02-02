/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const RESERVED_BROWSER_KEYBINDINGS: string[] = [
  'ctrl+r',       // Reload
  'ctrl+t',       // New tab
  'ctrl+w',       // Close tab
  'ctrl+l',       // Focus address bar
  'ctrl+d',       // Bookmark
  'ctrl+f',       // Find (браузерный)
  'ctrl+g',       // Find next
  'ctrl+shift+f', // Find in page
  'ctrl+shift+r', // Hard reload
  'ctrl+shift+t', // Reopen closed tab
  'shift+ctrl+r', // Hard reload (modifier order variation)
  'alt+ctrl+r',   // Hard reload (modifier order variation)
  'cmd+r',        // Mac reload
  'cmd+t',        // Mac new tab
  'cmd+w',        // Mac close tab
  'cmd+l',        // Mac address bar
  'cmd+d',        // Mac bookmark
  'cmd+f',        // Mac find
  'cmd+g',        // Mac find next
  'cmd+shift+f',  // Mac find in page
  'cmd+shift+r',  // Mac hard reload
];

export function isReservedBrowserKeybinding(keybindingStr: string): boolean {
  return RESERVED_BROWSER_KEYBINDINGS.includes(keybindingStr.toLowerCase());
}
