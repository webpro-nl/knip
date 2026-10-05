import type { UserConfig } from 'vite-plus';

export const baseLint = {
  jsPlugins: ['eslint-plugin-regexp'],
} as UserConfig['lint'];
