import { getStyleLang, styleExtractor } from '../../compilers/compilers.ts';
import { compiler as lessCompiler } from '../../compilers/less.ts';
import { compiler as scssCompiler } from '../../compilers/scss.ts';
import { compiler as stylusCompiler } from '../../compilers/stylus.ts';
import type { CompilerSync } from '../../compilers/types.ts';

const commentMatcher = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|^[ \t]*\/\/.*$/gm;
const conciseStyleMatcher = /^[ \t]*style(?:\.([\w.-]+))?[^\n{]*\{([\s\S]*?)^[ \t]*\}/gm;
const htmlTagMatcher = /<([a-z][\w.-]*)(?=[\s/|>])/g;
const conciseTagMatcher = /^[ \t]*([a-z][\w.-]*)(?=[ \t/|]|--|$)/gm;
const tagImportMatcher =
  /^[ \t]*(?:(?:server|client|static|\$)[ \t]+)?import\b[^\r\n]*\bfrom[ \t]*(["'])<[^"'\r\n]+>\1[ \t]*;?[ \t]*$/gm;
const markupLineMatcher = /^[ \t]*<.*$/gm;
const markoPrefixMatcher = /^([ \t]*)(?:server|client|\$)[ \t]+/gm;
const staticPrefixMatcher =
  /^([ \t]*)static[ \t]+(?=(?:import|export|const|let|var|function|class|interface|type|enum|namespace)\b)/gm;
const anonymousClassMatcher = /^([ \t]*)class[ \t]*\{/gm;
const localExportDeclarationMatcher =
  /^([ \t]*)export[ \t]+(?:default[ \t]+)?(?=(?:(?:declare|abstract|async)[ \t]+)*(?:interface|type[ \t]+[$\w]+|const|let|var|function|class|enum|namespace)\b)/gm;
const localExportListMatcher =
  /^[ \t]*export[ \t]+(?:type[ \t]+)?\{[^}]*\}(?![ \t\r\n]*from\b)[ \t]*;?[ \t]*(?=\r?$)/gm;

const compileStyle = (body: string, lang: string | undefined, path: string) => {
  switch (lang) {
    case 'less':
      return lessCompiler(body, path);
    case 'styl':
    case 'stylus':
      return stylusCompiler(body, path);
    default:
      return scssCompiler(body, path);
  }
};

const collectStyles = (text: string, path: string) => {
  const imports: string[] = [];
  styleExtractor.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = styleExtractor.exec(text))) {
    const lang = getStyleLang(match[1]) ?? match[1].match(/\.([\w-]+)/)?.[1];
    const output = compileStyle(match[2], lang, path);
    if (output) imports.push(output);
  }
  conciseStyleMatcher.lastIndex = 0;
  while ((match = conciseStyleMatcher.exec(text))) {
    const output = compileStyle(match[2], match[1]?.split('.').pop(), path);
    if (output) imports.push(output);
  }
  return imports;
};

const sanitize = (text: string) =>
  text
    .replace(styleExtractor, '')
    .replace(conciseStyleMatcher, '')
    .replace(tagImportMatcher, '')
    .replace(markupLineMatcher, '')
    .replace(markoPrefixMatcher, '$1')
    .replace(staticPrefixMatcher, '$1')
    .replace(localExportDeclarationMatcher, '$1')
    .replace(localExportListMatcher, '')
    .replace(anonymousClassMatcher, '$1class MarkoComponent {');

const collectTagDependencies = (
  text: string,
  tagDependencies: Map<string, string[]>,
  fallbackDependencies: string[]
) => {
  const dependencies = new Set(fallbackDependencies);
  for (const matcher of [htmlTagMatcher, conciseTagMatcher]) {
    matcher.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(text))) {
      for (const dependency of tagDependencies.get(match[1]) ?? []) dependencies.add(dependency);
    }
  }
  return [...dependencies].map(dependency => `import "${dependency}";`);
};

export const createCompiler =
  (tagDependencies = new Map<string, string[]>(), fallbackDependencies: string[] = []): CompilerSync =>
  (text, path) => {
    const source = text.replace(commentMatcher, '');
    return [
      'import "marko";',
      ...collectTagDependencies(source, tagDependencies, fallbackDependencies),
      ...collectStyles(source, path),
      sanitize(source),
    ].join('\n');
  };

const compiler = createCompiler();

export default compiler;
