/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require('./jest.config.shared'),
  displayName: 'dev',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: [],
};
