import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
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
  build: {
    ssr: false,
    sourcemap: "inline",
    outDir: resolve(__dirname, "dist/preload"),
    target: "es2023",
    assetsDir: ".",
    lib: {
      entry: resolve(__dirname, "src/preload/preload.ts"),
      formats: ["cjs"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
      external: ["electron"],
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
});
