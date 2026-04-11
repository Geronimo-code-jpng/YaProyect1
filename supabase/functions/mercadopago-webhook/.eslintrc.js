module.exports = {
  // Disable ESLint for Deno functions
  rules: {},
  overrides: [
    {
      files: ["*.ts", "*.js"],
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-declaration-merging": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/prefer-ts-expect-error": "off"
      }
    }
  ]
};
