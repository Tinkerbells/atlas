/** @type {import('lint-staged').Configuration} */
const config = {
  "apps/vue-desktop/**/*.{ts,vue}": [
    "npm exec -w @atlas/vue-desktop -- eslint --fix",
    () => "npm run typecheck -w @atlas/vue-desktop",
  ],
  "packages/di/**/*.ts": [
    "npm exec -w @atlas/di -- eslint --fix",
    () => "npm run typecheck -w @atlas/di",
  ],
  "packages/shared/**/*.ts": [
    "npm exec -w @atlas/shared -- eslint --fix",
    () => "npm run typecheck -w @atlas/shared",
  ],
  "packages/electron-main/**/*.ts": [
    "npm exec -w @atlas/electron-main -- eslint --fix",
    () => "npm run typecheck -w @atlas/electron-main",
  ],
  "packages/electron-preload/**/*.ts": [
    "npm exec -w @atlas/electron-preload -- eslint --fix",
    () => "npm run typecheck -w @atlas/electron-preload",
  ],
}

export default config
