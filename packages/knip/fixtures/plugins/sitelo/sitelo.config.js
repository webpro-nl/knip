export default {
  pagesDir: 'site',
  pageExtensions: ['.ht.js', '.page.ts'],
  exclude: ['site/drafts/**'],
  lighthouse: {
    include: ['*.html'],
    exclude: ['404.html'],
  },
};
