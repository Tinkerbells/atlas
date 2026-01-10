import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '.ruler/**/*',
    '.claude/**/*',
    '*.md',
    '**/*.md',
    '**/docs.md',
  ],
  formatters: true,
  unocss: true,
  solid: true,
  stylistics: {
    indent: 2,
    semi: true,
    quotes: 'double',
  },
  rules: {
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
})
