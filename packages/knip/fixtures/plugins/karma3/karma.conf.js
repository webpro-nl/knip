module.exports = config => {
  config.set({
    plugins: ['karma-jasmine', 'karma-coverage', './karma-plugin'],
  });
};
