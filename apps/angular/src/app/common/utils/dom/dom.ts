/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function isHTMLElement(e: unknown): e is HTMLElement {
  if (typeof e !== 'object' || e === null) {
    return false
  }

  return (
    'nodeType' in e
    && (e as Node).nodeType === 1 // Node.ELEMENT_NODE
    && 'nodeName' in e
  )
}

export function isEditableElement(element: Element): boolean {
  if (!isHTMLElement(element)) {
    return false
  }

  if (element.isContentEditable) {
    return true
  }

  const tagName = element.tagName

  if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
    const input = element as HTMLInputElement | HTMLTextAreaElement

    if (input.disabled || input.readOnly) {
      return false
    }

    if (tagName === 'INPUT') {
      const type = (input as HTMLInputElement).type
      const nonTextTypes = ['hidden', 'checkbox', 'radio', 'button', 'submit', 'image', 'reset']
      if (nonTextTypes.includes(type)) {
        return false
      }
    }

    return true
  }

  if ('editContext' in element && (element as any).editContext) {
    return true
  }

  return false
}
