import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  // Ignorar carpetas generadas
  { ignores: ["dist", "build", "node_modules", "coverage"] },

  // Base JS recomendado
  js.configs.recommended,

  // TypeScript estricto
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },

    settings: {
      react: { version: "detect" },
    },

    rules: {
      // ── React ──────────────────────────────────────
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules, // React 17+ (no necesita import React)
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off", // TypeScript lo cubre
      "react/self-closing-comp": "warn",
      "@typescript-eslint/no-unnecessary-template-expression": "error",

      // ── Accesibilidad ──────────────────────────────
      ...jsxA11y.configs.recommended.rules,

      // ── TypeScript ─────────────────────────────────
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",

      // ── Imports ────────────────────────────────────
      "import/order": [
        "warn",
        {
          groups: [
            "builtin", "external", "internal",
            ["parent", "sibling", "index"], "type"
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
      "import/no-duplicates": "error",

      // ── General ────────────────────────────────────
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
    },
  },

  // Archivos de config/scripts — menos estrictos
  {
    files: ["*.config.{ts,js}", "vite.config.*", "vitest.config.*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);