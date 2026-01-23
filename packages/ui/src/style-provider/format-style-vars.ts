function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export type StyleVars = Record<string, string>

export function formatStyleVars(styleVars: StyleVars | null): StyleVars {
  if (!styleVars)
    return {}

  return Object.entries(styleVars).reduce((styles, [key, value]) => {
    const cssVar = key.startsWith('--')
      ? key
      : `--${kebabCase(key)}`
    styles[cssVar] = value
    return styles
  }, {} as StyleVars)
}
