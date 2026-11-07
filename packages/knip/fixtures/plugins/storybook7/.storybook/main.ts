export default {
  framework: '@storybook/vue3-vite',
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        viteConfigPath: 'vite.storybook.ts',
      },
    },
  },
};
