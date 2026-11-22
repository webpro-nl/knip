const purgecssFromHtml = require('purgecss-from-html');

module.exports = {
  content: ['index.html'],
  css: ['print.css'],
  extractors: [{ extractor: purgecssFromHtml, extensions: ['html'] }],
};
