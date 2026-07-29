import { getStyleLang, styleExtractor } from '../../compilers/compilers.ts';
import { compiler as lessCompiler } from '../../compilers/less.ts';
import { compiler as scssCompiler } from '../../compilers/scss.ts';
import { compiler as stylusCompiler } from '../../compilers/stylus.ts';
import type { CompilerSync } from '../../compilers/types.ts';

const commentMatcher = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|^[ \t]*\/\/.*$/gm;
const importMatcher =
  /^[ \t]*(?:(?:server|client)[ \t]+)?(import\s+(?:(?:type\s+)?[^"'`;]+?\s+from\s+)?(["'])([^"'\r\n]+)\2)[ \t]*;?/gm;
const dynamicImportMatcher =
  /^[ \t]*(?:(?:const|let|var)[ \t]+[$\w]+[ \t]*=[ \t]*|(?:await[ \t]+)?)(import\([ \t]*(["'])([^"'\r\n]+)\2[ \t]*(?:,[^)\r\n]*)?\))[ \t]*;?/gm;
const exportMatcher =
  /^[ \t]*(export\s+(?:type\s+)?(?:\*(?:\s+as\s+[$\w]+)?|\{[^}]*\})\s+from\s+(["'])([^"'\r\n]+)\2)[ \t]*;?/gm;
const bracedStyleMatcher = /^[ \t]*style(?:\.([\w.-]+))?[^\n{]*\{([\s\S]*?)^[ \t]*\}/gm;
const fencedStyleStartMatcher = /^([ \t]*)style(?:\.([\w.-]+))?(?:\/[$\w]+)?[^\r\n]*\r?\n([ \t]+)(-{2,})[ \t]*\r?\n/gm;
const htmlTagMatcher = /<([a-z][\w.-]*)(?=[\s/|>])/g;
const conciseTagMatcher = /^[ \t]*([a-z][\w.-]*)(?=[ \t/|]|--|$)/gm;

const collectStatements = (text: string, matcher: RegExp) => {
  const statements: string[] = [];
  matcher.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text))) {
    if (!match[3].startsWith('<')) statements.push(`${match[1]};`);
  }
  return statements;
};

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

const findFencedStyleEnd = (text: string, start: number, fenceIndent: string, fence: string) => {
  let offset = start;
  while (offset < text.length) {
    const newline = text.indexOf('\n', offset);
    const lineEnd = newline === -1 ? text.length : newline;
    const contentEnd = text[lineEnd - 1] === '\r' ? lineEnd - 1 : lineEnd;
    const line = text.slice(offset, contentEnd);
    const contentStart = line.search(/[^ \t]/);
    if (contentStart !== -1) {
      const indent = line.slice(0, contentStart);
      const content = line.slice(contentStart).trimEnd();
      if (indent === fenceIndent && content === fence) {
        return { bodyEnd: offset, nextOffset: newline === -1 ? text.length : newline + 1 };
      }
      if (indent.length < fenceIndent.length) return { bodyEnd: offset, nextOffset: offset };
    }
    if (newline === -1) break;
    offset = newline + 1;
  }
  return { bodyEnd: text.length, nextOffset: text.length };
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
  bracedStyleMatcher.lastIndex = 0;
  while ((match = bracedStyleMatcher.exec(text))) {
    const output = compileStyle(match[2], match[1]?.split('.').pop(), path);
    if (output) imports.push(output);
  }
  fencedStyleStartMatcher.lastIndex = 0;
  while ((match = fencedStyleStartMatcher.exec(text))) {
    const tagIndent = match[1];
    const fenceIndent = match[3];
    if (fenceIndent.length <= tagIndent.length || !fenceIndent.startsWith(tagIndent)) continue;
    const bodyStart = fencedStyleStartMatcher.lastIndex;
    const { bodyEnd, nextOffset } = findFencedStyleEnd(text, bodyStart, fenceIndent, match[4]);
    const output = compileStyle(text.slice(bodyStart, bodyEnd), match[2]?.split('.').pop(), path);
    if (output) imports.push(output);
    fencedStyleStartMatcher.lastIndex = nextOffset;
  }
  return imports;
};

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
      ...collectStatements(source, importMatcher),
      ...collectStatements(source, dynamicImportMatcher),
      ...collectStatements(source, exportMatcher),
      ...collectStyles(source, path),
    ].join('\n');
  };

const compiler = createCompiler();

export default compiler;
