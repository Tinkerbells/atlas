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
  {
    files: ["src/**/*.{ts,vue}"],
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          case: "kebabCase",
          ignore: [/README\.md/],
        },
      ],
    },
  },
);
