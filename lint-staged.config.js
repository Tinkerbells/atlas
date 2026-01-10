/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */

export default {
  '**/*.{js,jsx,ts,tsx,vue}': [
    'npm run lint --',
    // Spell checking https://cspell.org/docs/getting-started
    // () => 'cspell .',
    // () => 'pnpm run lint:types',
  ],
}
