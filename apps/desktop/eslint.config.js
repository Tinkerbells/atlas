import { defineConfig } from "@atlas/eslint";

export default defineConfig(
  {
    type: "app",
    solid: true,
    rules: {
      "ts/no-namespace": "off",
    },
  },
  {
    ignores: [
      "storybook-static/**",
    ],
  },
);
