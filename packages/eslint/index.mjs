import deepmerge from "deepmerge";
import antfu from "@antfu/eslint-config";

const preset = {
  type: "lib",
  ignores: [
    ".ruler/**/*",
    ".claude/**/*",
    ".turbo/**/*",
    "node_modules/**/*",
    "dist/**/*",
    "coverage/**/*",
    "*.md",
    "**/*.md",
    "**/docs.md",
  ],
  stylistic: {
    indent: 2,
    semi: true,
    quotes: "double",
  },
  rules: {
    "ts/explicit-function-return-type": "off",
    "no-console": "off",
    "ts/no-duplicate-enum-values": "off",
    "ts/no-namespace": "off",
    "ts/no-this-alias": "off",
    "ts/no-use-before-define": "off",
    "unicorn/prefer-number-properties": "off",
    "unicorn/no-new-array": "off",
    "unicorn/error-message": "off",
    "import/no-mutable-exports": "off",
    "ts/no-redeclare": "off",
    "ts/no-unsafe-function-type": "off",
    "ts/prefer-literal-enum-member": "off",
    "node/prefer-global/process": "off",
    "no-restricted-syntax": "off",
    "unicorn/filename-case": [
      "error",
      {
        cases: {
          kebabCase: true,
          camelCase: true,
          pascalCase: true,
        },
        ignore: ["README.md"],
      },
    ],
    "perfectionist/sort-imports": [
      "error",
      {
        type: "line-length",
        internalPattern: ["^@web/.+", "^@/.+"],
      },
    ],
  },
};

export function defineConfig(options = {}, ...userConfigs) {
  return antfu(deepmerge(preset, options), ...userConfigs);
}

export default defineConfig();
