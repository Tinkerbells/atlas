import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')
const THEMES_DIR = path.join(SRC_DIR, 'themes')
const VARLET_THEMES_DIR = path.join(ROOT, 'varlet', 'packages', 'varlet-ui', 'src', 'themes')

async function loadTheme(relative: string) {
  const url = pathToFileURL(path.join(VARLET_THEMES_DIR, relative)).href
  const mod = await import(url)
  return (mod.default || mod) as Record<string, string>
}

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function formatObject(obj: Record<string, string>) {
  const entries = Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  const body = entries
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n')
  return `{
${body}\n}`
}

function generateThemeFile(fileName: string, constName: string, obj: Record<string, string>) {
  const content = `import type { StyleVars } from '../utils/styleVars'\n\nconst ${constName} = ${formatObject(obj)} satisfies StyleVars\n\nexport default ${constName}\n`
  writeFile(path.join(THEMES_DIR, `${fileName}.ts`), content)
}

function generateCommonCss(obj: Record<string, string>) {
  const lines = Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')
  const content = `:root {\n${lines}\n}\n`
  writeFile(path.join(SRC_DIR, 'styles', 'common.css'), content)
}

function generateIndex() {
  const content = `import md3Light from './md3-light'\nimport md3Dark from './md3-dark'\nexport { convert } from './convert'\nexport { toRem } from './toRem'\nexport { toViewport } from './toViewport'\n\nexport const Themes = { md3Light, md3Dark }\n\nexport type ThemeName = keyof typeof Themes\n\nexport default Themes\n`
  writeFile(path.join(THEMES_DIR, 'index.ts'), content)
}

function generateTypes(theme: Record<string, string>) {
  const keys = Object.keys(theme).sort()
  const content = `export type ThemeVarKey = ${keys.map((k) => `'${k}'`).join(' | ')}\n`
  writeFile(path.join(THEMES_DIR, 'types.d.ts'), content)
}

async function main() {
  const [md3Light, md3Dark] = await Promise.all([
    loadTheme('md3-light/index.ts'),
    loadTheme('md3-dark/index.ts'),
  ])

  generateThemeFile('md3-light', 'md3Light', md3Light)
  generateThemeFile('md3-dark', 'md3Dark', md3Dark)
  generateCommonCss(md3Light)
  generateIndex()
  generateTypes(md3Light)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
