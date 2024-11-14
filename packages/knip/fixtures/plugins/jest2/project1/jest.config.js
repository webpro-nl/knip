const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '../'),
  displayName: 'project1',
  setupFilesAfterEnv: ['<rootDir>/project1/setupFiles/setup.js'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>',
        outputName: 'junit-vcr.xml',
        testCasePropertiesFile: 'customProperties.cjs',
        testCasePropertiesDirectory: '<rootDir>/project1',
      },
    ],
  ],
};
