import { fencedCodeBlockMatcher, importMatcher, importsWithinFrontmatter } from './compilers.js';
import type { HasDependency } from './types.js';

// https://docs.astro.build/en/guides/integrations-guide/mdx/
const astroMDXDependencies = ['@astrojs/mdx', '@astrojs/starlight'];

// Fields in frontmatter that could contain imports
const frontmatterImportFields = ['layout'];

const condition = (hasDependency: HasDependency) => astroMDXDependencies.some(hasDependency);

const compiler = (text: string) => {
  const imports = text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher);

  const frontmatterImports = importsWithinFrontmatter(text, frontmatterImportFields);

  return [...imports, frontmatterImports].join('\n');
};

export default { condition, compiler };
