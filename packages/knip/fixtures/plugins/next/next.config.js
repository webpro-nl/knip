const createMDX = require('@next/mdx');
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

const withTM = require('next-transpile-modules')([]);

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-frontmatter', ['remark-mdx-frontmatter', { name: 'metadata' }]],
    rehypePlugins: [['rehype-starry-night']],
    recmaPlugins: ['recma-export-filepath'],
  },
});

module.exports = phase => {
  const config = withTM({});
  return withMDX({
    pageExtensions: ['ts', 'tsx'],
    ...config,
  });
};
