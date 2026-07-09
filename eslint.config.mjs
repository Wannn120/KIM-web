import { defineConfig } from "eslint/config";

export default defineConfig({
  root: true,
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
  },
  env: {
    browser: true,
    es2024: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  ignorePatterns: [".next/**", "out/**", "build/**", "next-env.d.ts"],
});
