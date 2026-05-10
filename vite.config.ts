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
      "~": resolve(__dirname, "src/ui"),
      "@": resolve(__dirname, "src"),
    },
  },
});
