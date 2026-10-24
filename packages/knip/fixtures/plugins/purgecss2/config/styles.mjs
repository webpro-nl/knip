import purgecssFromHtml from 'purgecss-from-html';

export default {
  content: ['index.html'],
  css: ['styles.css'],
  extractors: [{ extractor: purgecssFromHtml, extensions: ['html'] }],
};
