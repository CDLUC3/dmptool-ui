const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const reactPlugin = require("eslint-plugin-react");
const unusedImportsPlugin = require("eslint-plugin-unused-imports");

module.exports = [
  // Global ignores
  {
    ignores: [
      "app/dmps/*",
      "generated/graphql.ts",
      "public/tinymce/*",
      "coverage/*",
      "node_modules/**",
      ".next/**",
      "next-env.d.ts",
      "e2e/**",
      "eslint.config.js",
      "scripts/**",
      "__mocks__/"
    ]
  },
  // Main configuration
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true
        }
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "react": reactPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // JavaScript rules
      "prefer-const": "warn",
      "no-var": "warn",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_"
        }
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "object-shorthand": "warn",
      "quote-props": ["warn", "as-needed"],
      // React rules
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",
      // TypeScript rules
      "@typescript-eslint/array-type": [
        "warn",
        {
          "default": "array"
        }
      ],
      "@typescript-eslint/consistent-type-assertions": [
        "warn",
        {
          "assertionStyle": "as",
          "objectLiteralTypeAssertions": "never"
        }
      ]
    },
  },
];