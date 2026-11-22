import { resolve } from 'node:path';

export default {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
    resolve(import.meta.dirname, '../screens/**/*.stories.tsx'),
    { directory: resolve(import.meta.dirname, '../widgets') },
  ],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
};
