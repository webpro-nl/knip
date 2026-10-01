import viteReact from '@vitejs/plugin-react';

export default {
  framework: '@storybook/react-vite',
  viteFinal(config) {
    config.plugins = [viteReact({ babel: { plugins: [['babel-plugin-react-compiler', { target: '19' }]] } })];
    return config;
  },
};
