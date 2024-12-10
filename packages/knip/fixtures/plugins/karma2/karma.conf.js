module.exports = config => {
  config.set({
    basePath: 'src',
    files: ['**/*.spec.js'],
    // 👇 Not taken into account by plugin for now
    exclude: [''],
  });
};
