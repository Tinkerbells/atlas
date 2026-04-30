import UnoCSS from "unocss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS({ configFile: resolve(__dirname, "uno.config.ts") }),
  ],
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
      "@atlas/di": resolve(__dirname, "../../packages/di/src/index.ts"),
      "@atlas/shared": resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
