/** @type {import('lint-staged').Configuration} */
const config = {
  "src/**/*.{ts,vue}": [
    "eslint --fix",
    () => "npm run typecheck",
  ],
}

export default config
