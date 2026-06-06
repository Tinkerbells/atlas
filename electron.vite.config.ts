import ui from "@nuxt/ui/vite";
import UnoCSS from "unocss/vite";
import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "~/common": resolve("src/common"),
        "~/main": resolve("src/main"),
        "~/preload": resolve("src/preload"),
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: false,
    },
    resolve: {
      alias: {
        "~/common": resolve("src/common"),
        "~/main": resolve("src/main"),
        "~/preload": resolve("src/preload"),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "~/common": resolve("src/common"),
        "~/renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [
      UnoCSS(),
      vue(),
      ui({
        router: false,
      }),
    ],
  },
});
