import { fencedCodeBlockMatcher, importMatcher, importsWithinFrontmatter } from './compilers.js';
import type { HasDependency } from './types.js';

// https://mdxjs.com/packages/
const mdxDependencies = [
  'astro',
  '@mdx-js/esbuild',
  '@mdx-js/loader',
  '@mdx-js/mdx',
  '@mdx-js/node-loader',
  '@mdx-js/preact',
  '@mdx-js/react',
  '@mdx-js/rollup',
  '@mdx-js/vue',
  'remark-mdx',
];

const condition = (hasDependency: HasDependency) => mdxDependencies.some(hasDependency);

const compiler = (text: string) => {
  // Get imports from the MDX content ignoring imports within fenced code blocks
  const imports = [...text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher)].map(match => match[0]);

  let frontmatterImports = '';

  // If this is an Astro project, also treat the layout path in the frontmatter as an import
  if (mdxDependencies.includes('astro')) {
    frontmatterImports = importsWithinFrontmatter(text, ['layout']);
  }

  return [...imports, frontmatterImports].filter(Boolean).join('\n');
};

export default { condition, compiler };
