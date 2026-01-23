import { withNaming } from '@bem-react/classname'

export type CnMods = Record<string, string | boolean | undefined>

export const NAMESPACE = 'atlas-'

export const cn = withNaming({ e: '__', m: '_' })
export const block = withNaming({ n: NAMESPACE, e: '__', m: '--' })

/**
 * Combines given classNames into a single compound string in the format `modifier-value`
 *
 * @param classNames - An array of strings to combine
 * @returns A single string with the classNames combined as `modifier-value`
 */
export function compound(...classNames: string[]): string {
  return classNames.filter(Boolean).join('-')
}

export type CnBlock = ReturnType<typeof cn>
