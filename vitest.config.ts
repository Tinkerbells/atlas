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
      "~": resolve(__dirname, "src/ui"),
      "@": resolve(__dirname, "src"),
    },
  },
});
