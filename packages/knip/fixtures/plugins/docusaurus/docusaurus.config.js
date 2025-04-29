export default {
  title: 'Docusaurus',
  url: 'https://docusaurus.io',
  themes: ['@docusaurus/theme-mermaid', '@docusaurus/theme-search-algolia'],
  markdown: {
    mermaid: true,
  },
  plugins: [
    [
      '@docusaurus/plugin-content-blog',
      {
        path: 'blog',
        routeBasePath: 'blog',
        include: ['*.md', '*.mdx'],
      },
    ],
    '@docusaurus/plugin-content-pages',
    ['sitemap', { changefreq: 'weekly' }],
    'awesome',
    '@my-company',
    '@my-company/awesome',
    '@my-company/cool/web',
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        debug: false,
      },
    ],
  ],
};
