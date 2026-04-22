import { fileURLToPath } from "node:url";
import path, { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  resolve: {
    alias: {
      "@atlas/di": resolve(__dirname, "../../packages/di/src/index.ts"),
      "@atlas/shared": resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  test: {
    projects: [{
      extends: true,
      test: {
        globals: true,
        environment: "node",
      },
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
        storybookTest({
          configDir: path.join(dirname, ".storybook"),
        }),
      ],
      test: {
        name: "storybook",
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: "chromium",
          }],
        },
      },
    }],
  },
});
