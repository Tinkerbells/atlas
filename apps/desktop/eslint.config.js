import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angularEslint from "angular-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**/*", "release/**/*", "out-tsc/**/*", "app/**/*"],
  },
  {
    files: ["src/**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...angularEslint.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        project: [
          "./tsconfig.serve.json",
          "./src/tsconfig.app.json",
          "./src/tsconfig.spec.json",
        ],
        tsconfigRootDir: import.meta.dirname,
        createDefaultProgram: true,
      },
    },
    processor: angularEslint.processInlineTemplates,
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@angular-eslint/directive-selector": "off",
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      "no-useless-escape": "off",
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "prefer-arrow/prefer-arrow-functions": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["src/**/*.html"],
    extends: [...angularEslint.configs.templateRecommended],
    rules: {},
  },
);
