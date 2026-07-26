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
export const importMatcher = /import(?:\s*\(\s*['"][^'"]+['"][^)]*\)|(?!\s*\()[^'"]+['"][^'"]+['"])/g;
export const dynamicImportMatcher = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

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
    const body = scriptBody.replace(blockCommentMatcher, '').replace(lineCommentMatcher, '');
    let importMatch: RegExpExecArray | null;
    importMatcher.lastIndex = 0;
    while ((importMatch = importMatcher.exec(body))) scripts.push(importMatch[0]);
  }
  return scripts.join(';\n');
};

// Components can lazily `import()` modules straight from their template markup,
// outside of any <script> block (e.g. Svelte's `{#await import('./Modal.svelte')}`).
// `importsWithinScripts` only scans <script>, so collect these separately to
// avoid reporting lazily-imported files (and their transitive deps) as unused.
export const dynamicImportsWithinTemplate: CompilerSync = (text: string) => {
  const template = text.replace(scriptExtractor, '');
  if (!template.includes('import')) return '';
  const imports: string[] = [];
  dynamicImportMatcher.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = dynamicImportMatcher.exec(template))) imports.push(`import(${JSON.stringify(match[1])})`);
  return imports.join(';\n');
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
