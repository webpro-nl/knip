module.exports = {
  rootDir: '.',
  runner: 'groups',
  testEnvironment: 'miniflare',
  testSequencer: 'alphabetical',
  watchPlugins: ['typeahead/filename', ['typeahead/testname', { key: 't' }]],
};
