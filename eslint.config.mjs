import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Lenient rules for test files and scripts
    files: ["tests/**/*", "**/*.test.ts", "**/*.test.tsx", "scripts/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-empty-function": "off",
      "no-unused-vars": "off",
      "prefer-const": "off",
    },
  },
  {
    // Strict rules for non-test files (production code)
    files: ["app/**/*", "components/**/*", "lib/**/*", "server/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/set-state-in-effect": "error",
      "react/no-unescaped-entities": "error",
      "prefer-const": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
]);

export default eslintConfig;
