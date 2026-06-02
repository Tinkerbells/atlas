import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{spec,test}.ts"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["node_modules/", "src/preload/"],
    },
  },
  resolve: {
    alias: {
      "~/common": resolve("src/common"),
      "~/main": resolve("src/main"),
      "~/renderer": resolve("src/renderer/src"),
      "~/preload": resolve("src/preload"),
    },
  },
});
