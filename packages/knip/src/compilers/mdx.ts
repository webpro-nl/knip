import { fencedCodeBlockMatcher, frontmatterMatcher, inlineCodeMatcher } from './compilers.ts';

// https://mdxjs.com/packages/
const dependencies = [
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

const mdxImportMatcher = /^import[^'"]+['"][^'"]+['"]/gm;

const compiler = (text: string) =>
  [
    ...text
      .replace(frontmatterMatcher, '')
      .replace(fencedCodeBlockMatcher, '')
      .replace(inlineCodeMatcher, '')
      .matchAll(mdxImportMatcher),
  ].join('\n');

export default { dependencies, compiler };
