const createMDX = require('@next/mdx');

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-frontmatter', ['remark-mdx-frontmatter', { name: 'metadata' }]],
    rehypePlugins: [['rehype-starry-night']],
    recmaPlugins: ['recma-export-filepath'],
  },
});

module.exports = withMDX({
  pageExtensions: ['ts', 'tsx', 'mdx'],
});
