const path = require('node:path');

module.exports = config => {
  config.set({
    basePath: path.join(__dirname, 'src'),
    files: ['**/*.spec.js'],
    exclude: ['**/*excluded*.js'],
  });
};
