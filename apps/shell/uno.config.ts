import { defineConfig } from "unocss";
import presetMini from "@unocss/preset-mini";
import presetAttributify from "@unocss/preset-attributify";

export default defineConfig({
  presets: [
    presetMini(),
    presetAttributify(),
  ],
});
