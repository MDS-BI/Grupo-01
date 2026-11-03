import js from '@eslint/js';

export default [
  ...js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    ignores: ["node_modules", "dist"],
  },
];