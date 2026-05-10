import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
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
