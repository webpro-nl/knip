import {
  fencedCodeBlockMatcher,
  importMatcher,
  importsWithinFrontmatter,
  inlineCodeMatcher,
} from '../../compilers/compilers.ts';

// Fields in frontmatter that could contain imports
const frontmatterImportFields = ['layout'];

const compiler = (text: string) => {
  const imports = text.replace(fencedCodeBlockMatcher, '').replace(inlineCodeMatcher, '').matchAll(importMatcher);

  const frontmatterImports = importsWithinFrontmatter(text, frontmatterImportFields);

  return [...imports, frontmatterImports].join('\n');
};

export default compiler;
