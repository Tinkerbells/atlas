import merge from 'deepmerge'
import antfu from '@antfu/eslint-config'


const preset = {
  type: 'lib',
  ignores: [
    '.ruler/**/*',
    '.claude/**/*',
    '*.md',
    '**/*.md',
    '**/docs.md',
  ],
  stylistics: {
    indent: 2,
    semi: true,
    quotes: 'double',
  },
  rules: {
    'ts/explicit-function-return-type': 0,
    'no-console': 0,
    'perfectionist/sort-imports': ['error', {
      type: 'line-length',
      internalPattern: ['^@web/.+', '^@/.+'],
    }],
    'unicorn/filename-case': [
      'warn',
      {
        case: 'kebabCase',
      },
    ],
  },
}

export function defineConfig(options = {}, ...userConfigs) {
  return antfu(
    merge(preset, options),
    ...userConfigs,
  )
}

export default defineConfig()
