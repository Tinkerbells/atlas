export type ClassValue = string | false | null | undefined

function normalize(s: string) {
  return s
    .replace(/\s+/g, ' ')
    .trim()
}

export function joinClasses(...values: ClassValue[]): string {
  return normalize(
    values
      .filter(Boolean)
      .map(String)
      .join(' '),
  )
}

export function createNamespace(component: string, styles: Record<string, string>) {
  const base = component

  const resolve = (suffix = '') => styles[`${base}${suffix}`] ?? `${base}${suffix}`

  const element = (name: string) => resolve(`__${name}`)
  const modifier = (name: string) => resolve(`--${name}`)

  const bem = (...classes: ClassValue[]) => joinClasses(...classes)

  return {
    name: base,
    n: resolve,
    e: element,
    m: modifier,
    bem,
  }
}
