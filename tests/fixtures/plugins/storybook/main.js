const path = require('path');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = {
  features: {
    // Enables code splitting
    storyStoreV7: true,
  },
  stories: [],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-knobs/preset',
    'storybook-addon-export-to-codesandbox',
    './addon/register',
  ],
  webpackFinal: config => {
    const tsPaths = new TsconfigPathsPlugin({
      configFile: path.resolve(__dirname, '../tsconfig.base.json'),
    });

    if (config.resolve) {
      config.resolve.plugins ? config.resolve.plugins.push(tsPaths) : (config.resolve.plugins = [tsPaths]);
    }

    if (config.module && config.module.rules) {
      const codesandboxRule = {
        use: {
          loader: 'babel-loader',
        },
      };

      config.module.rules.push(codesandboxRule);

      overrideDefaultBabelLoader(config.module.rules);
    }

    return config;
  },
  core: {
    builder: 'webpack5',
    lazyCompilation: true,
  },
  framework: {
    name: '@storybook/react-webpack5',
  },
};
