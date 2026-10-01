module.exports = {
  stories: [
    '../*.tales.js',
    {
      directory: '../epic',
    },
    {
      files: '*.fable.tsx',
      directory: '../epic',
    },
  ],
  core: {
    builder: '@storybook/builder-vite',
  },
};
