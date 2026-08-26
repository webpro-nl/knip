import {
  fencedCodeBlockMatcher,
  importMatcher,
  importsWithinFrontmatter,
  inlineCodeMatcher,
} from '../../compilers/compilers.ts';

// Fields in frontmatter that could contain imports
const frontmatterImportFields = ['layout'];

const compiler = (text: string) => {
  const frontmatterImports = importsWithinFrontmatter(text, frontmatterImportFields);
  if (!text.includes('import')) return frontmatterImports;

  const imports: string[] = [];
  const source = text.replace(fencedCodeBlockMatcher, '').replace(inlineCodeMatcher, '');
  let match: RegExpExecArray | null;
  importMatcher.lastIndex = 0;
  while ((match = importMatcher.exec(source))) imports.push(match[0]);
  if (frontmatterImports) imports.push(frontmatterImports);
  return imports.join('\n');
};

export default compiler;
