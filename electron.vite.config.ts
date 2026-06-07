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
    root: resolve("src/renderer"),
    resolve: {
      alias: {
        "~/common": resolve("src/common"),
        "~/renderer": resolve("src/renderer/src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
    plugins: [vue()],
  },
});
