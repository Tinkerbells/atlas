import { defineConfig, configDefaults } from "vitest/config";
import { resolve } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**", "sigma-file-manager/**", "**/node_modules/**"],
    root: "./",
    include: ["src/**/*.{test,spec}.{js,ts}", "src/**/__tests__/*.{js,ts}"],
    typecheck: {
      tsconfig: resolve(__dirname, "tsconfig.json"),
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      "@renderer": resolve(__dirname, "src/renderer"),
      "@main": resolve(__dirname, "src/main"),
      "@preload": resolve(__dirname, "src/preload"),
      "@shared-process": resolve(__dirname, "src/shared-process"),
      "@core": resolve(__dirname, "src/core"),
      "@platform": resolve(__dirname, "src/platform"),
    },
  },
});
