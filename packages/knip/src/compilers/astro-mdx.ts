import { fencedCodeBlockMatcher, importMatcher, importsWithinFrontmatter } from './compilers.js';
import type { HasDependency } from './types.js';

// https://mdxjs.com/packages/
const mdxDependencies = ['@astrojs/mdx'];

// Fields in frontmatter that could contain imports
const frontmatterImportFields = ['layout'];

const condition = (hasDependency: HasDependency) => mdxDependencies.some(hasDependency);

const compiler = (text: string) => {
  const imports = text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher);

  const frontmatterImports = [importsWithinFrontmatter(text, frontmatterImportFields)];

  return [...imports, ...frontmatterImports].join('\n');
};

export default { condition, compiler };
