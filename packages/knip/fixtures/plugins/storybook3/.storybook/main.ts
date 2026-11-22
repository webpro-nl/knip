export default {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  core: {
    builder: { name: '@storybook/builder-vite', options: { viteConfigPath: 'vite.storybook.ts' } },
  },
};
