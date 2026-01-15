import { fencedCodeBlockMatcher, importMatcher, inlineCodeMatcher } from './compilers.js';
import type { HasDependency } from './types.js';

// https://mdxjs.com/packages/
const mdxDependencies = [
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

const compiler = (text: string) =>
  [...text.replace(fencedCodeBlockMatcher, '').replace(inlineCodeMatcher, '').matchAll(importMatcher)].join('\n');

export default { condition, compiler };
