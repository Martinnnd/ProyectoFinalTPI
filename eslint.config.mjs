import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // Existing code still triggers these rules. Keep them visible while migrating gradually.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "_respaldo/**",
    "integracion/**",
    "next-env.d.ts",
  ]),
]);
