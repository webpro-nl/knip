module.exports = function (app) {
  const mocks = require('glob').sync('./mocks/**/*.js', { cwd: __dirname }).map(require);
  for (const mock of mocks) mock(app);
};
