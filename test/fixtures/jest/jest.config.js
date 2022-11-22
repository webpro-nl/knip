/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require('./jest.config.shared'),
  displayName: 'dev',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupAfterEnv.ts'],
  setupFiles: [],
};
