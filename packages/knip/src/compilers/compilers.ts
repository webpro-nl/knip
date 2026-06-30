import type { CompilerSync } from './types.ts';

export const fencedCodeBlockMatcher = /```[\s\S]*?```/g;
export const inlineCodeMatcher = /`[^`]+`/g;

// Match <script> blocks, capturing attributes (1) and body (2).
// Tag-attribute scan allows `>` inside quoted attribute values (e.g. Vue `generic="T extends F<X>"`).
export const scriptExtractor = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script>/gi;
const styleExtractor = /<style\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/style>/gi;
const langAttrMatcher = /\blang\s*=\s*["']([^"']+)["']/i;
export const blockCommentMatcher = /\/\*[\s\S]*?\*\//g;
export const lineCommentMatcher = /^[ \t]*\/\/.*$/gm;
export const importMatcher = /import(?:\s*\(\s*['"][^'"]+['"][^)]*\)|(?!\s*\()[^'"]+['"][^'"]+['"])/g;

export const importsWithinScripts: CompilerSync = (text: string) => {
  const scripts = [];
  for (const [, , scriptBody] of text.matchAll(scriptExtractor)) {
    const body = scriptBody.replace(blockCommentMatcher, '').replace(lineCommentMatcher, '');
    for (const importMatch of body.matchAll(importMatcher)) scripts.push(importMatch);
  }
  return scripts.join(';\n');
};

export const scriptBodies: CompilerSync = (text: string) => {
  const scripts = [];
  for (const [, , body] of text.matchAll(scriptExtractor)) {
    if (body) scripts.push(body);
  }
  return scripts.join(';\n');
};

// Extract bodies of <style> blocks whose `lang="..."` attribute is in `langs`, joined by newline.
export const styleBodiesByLang = (text: string, langs: string[]): string => {
  const bodies = [];
  for (const [, attrs, body] of text.matchAll(styleExtractor)) {
    if (!body) continue;
    const lang = attrs.match(langAttrMatcher)?.[1]?.toLowerCase();
    if (lang && langs.includes(lang)) bodies.push(body);
  }
  return bodies.join('\n');
};

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
