module.exports = {
  default: {
    import: ['steps/**/*.ts'],
    format: ['progress-bar', 'html:reports/cucumber.html'],
  },
  ci: {
    require: ['support/**/*.ts'],
    format: [['json', 'reports/cucumber.json'], '"./formatters/summary.ts":"reports/summary.txt"', '@cucumber/pretty-formatter'],
  },
};
