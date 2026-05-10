import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: true,
    sourcemap: "inline",
    outDir: resolve(__dirname, "dist/shared-process"),
    assetsDir: ".",
    target: "node22",
    lib: {
      entry: resolve(__dirname, "src/shared-process/shared-process-main.ts"),
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
