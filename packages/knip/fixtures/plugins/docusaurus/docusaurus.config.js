export default {
  title: 'Docusaurus',
  url: 'https://docusaurus.io',
  scripts: ['/js/custom.js', { src: '/js/analytics.js', async: true }, 'https://example.com/external.js'],
  stylesheets: ['/css/custom.css', { href: '/css/theme.css' }, 'https://example.com/external.css'],
  future: {
    experimental_faster: true,
  },
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
        sidebarPath: './sidebars.js',
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
