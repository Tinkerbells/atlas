import UnoCSS from "unocss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS({ configFile: resolve(__dirname, "uno.config.ts") }),
  ],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
    base: "./",
  },
  optimizeDeps: {
    exclude: ["@microsoft/1ds-core-js", "@microsoft/1ds-post-js"],
  },
  resolve: {
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
