import { defineConfig } from "@atlas/eslint";

export default defineConfig(
  {
    type: "app",
    vue: true,
  },
  {
    ignores: [
      ".playwright-cli/**",
      "storybook-static/**",
    ],
  },
);
