import createMDX from '@next/mdx';
import rehypeExpressiveCode from 'rehype-expressive-code';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';

/** @type {import('rehype-expressive-code').RehypeExpressiveCodeOptions} */
const rehypeExpressiveCodeOptions = {
  themes: ['github-dark', 'github-light'],
  plugins: [pluginCollapsibleSections()],
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};

const withMDX = createMDX({
  options: {
    rehypePlugins: [[rehypeExpressiveCode, rehypeExpressiveCodeOptions]],
  },
});

export default withMDX(nextConfig);
