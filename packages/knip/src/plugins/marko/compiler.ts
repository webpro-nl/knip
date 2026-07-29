import { getStyleLang, styleExtractor } from '../../compilers/compilers.ts';
import { compiler as lessCompiler } from '../../compilers/less.ts';
import { compiler as scssCompiler } from '../../compilers/scss.ts';
import { compiler as stylusCompiler } from '../../compilers/stylus.ts';
import type { CompilerSync } from '../../compilers/types.ts';

const commentMatcher = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|^[ \t]*\/\/.*$/gm;
const importMatcher =
  /^[ \t]*(?:(?:server|client)[ \t]+)?(import[ \t]+(?:(?:type[ \t]+)?[^"'\r\n]+?[ \t]+from[ \t]+)?(["'])([^"'\r\n]+)\2)[ \t]*;?/gm;
const dynamicImportMatcher =
  /^[ \t]*(?:(?:const|let|var)[ \t]+[$\w]+[ \t]*=[ \t]*|(?:await[ \t]+)?)(import\([ \t]*(["'])([^"'\r\n]+)\2[ \t]*(?:,[^)\r\n]*)?\))[ \t]*;?/gm;
const exportMatcher =
  /^[ \t]*(export[ \t]+(?:type[ \t]+)?(?:\*(?:[ \t]+as[ \t]+[$\w]+)?|\{[^}\r\n]*\})[ \t]+from[ \t]+(["'])([^"'\r\n]+)\2)[ \t]*;?/gm;
const conciseStyleMatcher = /^[ \t]*style(?:\.([\w.-]+))?[^\n{]*\{([\s\S]*?)^[ \t]*\}/gm;

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

const compiler: CompilerSync = (text, path) => {
  const source = text.replace(commentMatcher, '');
  return [
    'import "marko";',
    ...collectStatements(source, importMatcher),
    ...collectStatements(source, dynamicImportMatcher),
    ...collectStatements(source, exportMatcher),
    ...collectStyles(source, path),
  ].join('\n');
};

export default compiler;
