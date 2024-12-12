module.exports = config => {
  config.set({
    basePath: 'src',
    files: ['**/*.spec.js'],
    exclude: ['**/*excluded*.js'],
  });
};
