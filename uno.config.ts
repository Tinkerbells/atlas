import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
  ],
  cli: {
    entry: {
      /**
       * Glob patterns to match files
       * Include HTML and inline templates in components.
       */
      patterns: ['src/**/*.html', 'src/**/*.ts'],
      /**
       * The output filename for the generated UnoCSS file
       */
      outFile: './src/uno.css',
    },
  },
})
