const base = {
  jsPlugins: ['eslint-plugin-testing-library'],
};

const specOverride = {
  files: ['**/*.spec.ts'],
  jsPlugins: ['eslint-plugin-vitest'],
};

export const testLint = {
  overrides: [{ files: ['**/*.test.ts'], ...base }, specOverride],
};
