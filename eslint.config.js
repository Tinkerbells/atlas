import antfu from "@antfu/eslint-config";

const config = antfu({
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
    "**/test/**/fixtures/**/*",
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
        case: "kebabCase",
        ignore: ["README.md", "CLAUDE.md"],
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
});

export default config;
