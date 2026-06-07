import ts from "typescript-eslint";
import eslintPluginVue from "eslint-plugin-vue";

export default ts.config(
  ...ts.configs.recommended,
  ...eslintPluginVue.configs["flat/recommended"],
  {
    files: ["*.vue", "**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": ["error", { singleline: 3 }],
      "no-undef": "off",
    },
  },
);
