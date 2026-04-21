/** @type {import('lint-staged').Configuration} */
const config = {
  "apps/vue-desktop/**/*.{ts,vue}": [
    "pnpm --filter=@atlas/vue-desktop exec -- eslint --fix",
    () => "pnpm --filter=@atlas/vue-desktop typecheck",
  ],
  "packages/di/**/*.ts": [
    "pnpm --filter=@atlas/di exec -- eslint --fix",
    () => "pnpm --filter=@atlas/di typecheck",
  ],
  "packages/shared/**/*.ts": [
    "pnpm --filter=@atlas/shared exec -- eslint --fix",
    () => "pnpm --filter=@atlas/shared typecheck",
  ],
  "packages/electron-main/**/*.ts": [
    "pnpm --filter=@atlas/electron-main exec -- eslint --fix",
    () => "pnpm --filter=@atlas/electron-main typecheck",
  ],
  "packages/electron-preload/**/*.ts": [
    "pnpm --filter=@atlas/electron-preload exec -- eslint --fix",
    () => "pnpm --filter=@atlas/electron-preload typecheck",
  ],
}

export default config
