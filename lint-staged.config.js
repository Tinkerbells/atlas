/** @type {import('lint-staged').Configuration} */
const config = {
  'apps/desktop/**/*.{js,jsx,ts,tsx,vue}': [
    // Limit ESLint to staged files in the desktop app.
    'pnpm --filter atlas exec -- eslint --cache',
    // Run full typecheck without forwarding staged file args.
    () => 'pnpm --filter atlas typecheck',
  ],
  'packages/ui/**/*.{js,jsx,ts,tsx,vue}': [
    'pnpm --filter @atlas/ui exec -- eslint --cache',
  ],
}

module.exports = config
