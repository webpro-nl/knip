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
const mdxReExportMatcher = /^export\s*\{([^}]*)\}\s*from\s*(['"][^'"]+['"])/gm;

const compiler = (text: string) => {
  if (!text.includes('import') && !text.includes('export')) return '';
  const imports: string[] = [];
  const source = text
    .replace(frontmatterMatcher, '')
    .replace(fencedCodeBlockMatcher, '')
    .replace(inlineCodeMatcher, '');
  let match: RegExpExecArray | null;
  mdxImportMatcher.lastIndex = 0;
  while ((match = mdxImportMatcher.exec(source))) imports.push(match[0]);
  mdxReExportMatcher.lastIndex = 0;
  while ((match = mdxReExportMatcher.exec(source))) {
    const names = match[1].replace(/\s+as\s+[\w$]+/g, '').replace(/\bdefault\b/, 'default as _');
    imports.push(`import {${names}} from ${match[2]}`);
  }
  return imports.join('\n');
};

export default { dependencies, compiler };
