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

// Fields in frontmatter that could contain imports
const frontmatterImportFields = ['layout'];

const condition = (hasDependency: HasDependency) => mdxDependencies.some(hasDependency);

const compiler = (text: string) => {
  const imports = text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher);

  const frontmatterImports = [importsWithinFrontmatter(text, frontmatterImportFields)];

  return [...imports, ...frontmatterImports].join('\n');
};

export default { condition, compiler };
