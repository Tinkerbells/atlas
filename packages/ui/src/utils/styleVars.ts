export type StyleVars = Record<string, string>

const camelToKebab = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()

export function formatStyleVars(styleVars?: StyleVars | null): StyleVars {
  return Object.entries(styleVars ?? {}).reduce<StyleVars>((acc, [key, value]) => {
    const cssVar = key.startsWith('--') ? key : `--${camelToKebab(key)}`
    acc[cssVar] = value
    return acc
  }, {})
}

export function styleVarsToString(styleVars?: StyleVars | null): string {
  const normalized = formatStyleVars(styleVars)
  const body = Object.entries(normalized)
    .map(([key, value]) => `${key}:${value};`)
    .join('')

  return `:root{${body}}`
}
