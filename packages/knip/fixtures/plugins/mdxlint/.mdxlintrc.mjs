import remarkDirective from 'remark-directive';

export default {
  plugins: [remarkDirective, 'remark-gfm', '@mapbox/lint-link-text'],
};
