import UnoCSS from "unocss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import autoImport from "unplugin-auto-import/vite";
import components from "unplugin-vue-components/vite";
import { presetAttributify, presetUno } from "unocss";
import { VarletImportResolver } from "@varlet/import-resolver";

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS({
      presets: [presetUno(), presetAttributify()],
    }),
    components({
      resolvers: [VarletImportResolver()],
    }),
    autoImport({
      resolvers: [VarletImportResolver({ autoImport: true })],
    }),
  ],
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
      "@atlas/di": resolve(__dirname, "../../packages/di/src/index.ts"),
      "@atlas/shared": resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
