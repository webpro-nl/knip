const purgecssFromHtml = require('purgecss-from-html');
const safelist = require('./safelist.js');

module.exports = {
  content: ['index.html', 'src/**/*.js'],
  css: ['styles.css'],
  extractors: [{ extractor: purgecssFromHtml, extensions: ['html'] }],
  safelist,
};
