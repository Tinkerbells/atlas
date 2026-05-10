import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: true,
    sourcemap: "inline",
    outDir: resolve(__dirname, "dist/main"),
    assetsDir: ".",
    target: "node22",
    lib: {
      entry: resolve(__dirname, "src/main/main.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
      external: ["electron", "electron-updater", "@vscode/ripgrep"],
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
