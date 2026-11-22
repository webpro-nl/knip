module.exports = {
  stories: ['../examples/*.story.js'],
  framework: {
    name: '@storybook/html-vite',
    options: { builder: { viteConfigPath: 'vite.storybook.ts' } },
  },
};
