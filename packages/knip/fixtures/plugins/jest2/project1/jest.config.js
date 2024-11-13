const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '../'),
  displayName: 'project1',
  setupFilesAfterEnv: ['<rootDir>/project1/setupFiles/setup.js'],
};
