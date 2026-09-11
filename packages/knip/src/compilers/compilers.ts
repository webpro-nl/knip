import type { CompilerSync } from './types.ts';

export const fencedCodeBlockMatcher = /```[\s\S]*?```/g;
export const inlineCodeMatcher = /`[^`]+`/g;

// Match <script> blocks, capturing attributes (1) and body (2).
// Tag-attribute scan allows `>` inside quoted attribute values (e.g. Vue `generic="T extends F<X>"`).
export const scriptExtractor = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script>/gi;
export const styleExtractor = /<style\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/style>/gi;
const langAttrMatcher = /\blang\s*=\s*["']([^"']+)["']/i;
export const blockCommentMatcher = /\/\*[\s\S]*?\*\//g;
export const lineCommentMatcher = /^[ \t]*\/\/.*$/gm;
export const javascriptNonCodeMatcher =
  /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\$]|\$(?!\{))*`|\/\/[^\r\n\u2028\u2029]*|\/\*[\s\S]*?(?:\*\/|$)/g;
export const importMatcher = /\bimport\b(?:\s*\(\s*['"][^'"]+['"][^)]*\)|(?!\s*\()[^'"]+['"][^'"]+['"])/g;

// Blank out comments and string contents (keeping quote characters and length so
// offsets stay aligned), so keywords inside them are never mistaken for imports.
const maskNonCode = (match: string) => {
  const quote = match[0];
  const isQuoted = (quote === '"' || quote === "'" || quote === '`') && match.length > 1 && match.endsWith(quote);
  return isQuoted ? `${quote}${' '.repeat(match.length - 2)}${quote}` : ' '.repeat(match.length);
};

export const collectImports: CompilerSync = text => {
  if (!text.includes('import')) return '';
  const imports: string[] = [];
  importMatcher.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = importMatcher.exec(text))) imports.push(match[0]);
  return imports.join('\n');
};

export const importsWithinScripts: CompilerSync = (text: string) => {
  const scripts = [];
  scriptExtractor.lastIndex = 0;
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptExtractor.exec(text))) {
    const scriptBody = scriptMatch[2];
    if (!scriptBody) continue;
    const masked = scriptBody.replace(javascriptNonCodeMatcher, maskNonCode);
    let importMatch: RegExpExecArray | null;
    importMatcher.lastIndex = 0;
    while ((importMatch = importMatcher.exec(masked))) {
      const start = importMatch.index;
      scripts.push(scriptBody.slice(start, start + importMatch[0].length));
    }
  }
  return scripts.join(';\n');
};

export const scriptBodies: CompilerSync = (text: string) => {
  const scripts = [];
  scriptExtractor.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = scriptExtractor.exec(text))) {
    const body = match[2];
    if (body) scripts.push(body);
  }
  return scripts.join(';\n');
};

export const getStyleLang = (attrs: string) => attrs.match(langAttrMatcher)?.[1]?.toLowerCase();

// Extract paths as imports from frontmatter for given keys (e.g., 'layout')
export const frontmatterMatcher = /^---\r?\n([\s\S]*?)\r?\n---/;
export const importsWithinFrontmatter = (text: string, keys: string[] = []) => {
  const frontmatter = text.match(frontmatterMatcher)?.[1];
  if (!frontmatter) return '';

  const imports = keys.flatMap(key => {
    const valueMatcher = new RegExp(`${key}:\\s*["']([^"']+)["']`, 'i');
    const match = frontmatter.match(valueMatcher);
    return match?.[1] ? [`import ${key} from "${match[1]}";`] : [];
  });
  return imports.join('\n');
};
