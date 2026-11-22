import type { UserConfig } from 'vite-plus';

const lint: UserConfig['lint'] = {
  jsPlugins: ['eslint-plugin-regexp', { name: 'orchard', specifier: './tooling/oxlint-plugin-orchard.ts' }],
};

export { lint };
