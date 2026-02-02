/** @type {import('lint-staged').Configuration} */
export default {
  'apps/desktop/**/*.{ts,tsx}': [
    // Limit ESLint to staged files in the desktop app.
    'pnpm --filter atlas exec -- eslint --cache',
    // Run full typecheck without forwarding staged file args.
    () => 'pnpm --filter atlas typecheck',
  ],
  'packages/ui/**/*.{ts,tsx}': [
    'pnpm --filter @atlas/ui exec -- eslint --cache',
  ],
}
