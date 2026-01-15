interface ClassNamesDictionary {
  [index: string]: boolean | undefined | null
}

export type ClassName = string | number | ClassNamesDictionary | boolean | undefined | null

export function cn(...args: ClassName[]): string {
  const result: string[] = []

  args.forEach((item): void => {
    if (!item) {
      return
    }

    switch (typeof item) {
      case 'string':
        result.push(item)
        break

      case 'object':
        Object.keys(item).forEach((key: string) => {
          if (item[key]) {
            result.push(key)
          }
        })
        break

      default:
        result.push(`${item}`)
    }
  })

  return result.join(' ')
}
