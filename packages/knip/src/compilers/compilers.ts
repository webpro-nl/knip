import type { SyncCompilerFn } from './types.js';

const scriptExtractor = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
export const importMatcher = /import[^'"]+['"]([^'"]+)['"]/g;
export const fencedCodeBlockMatcher = /```[\s\S]*?```/g;

export const importsWithinScripts: SyncCompilerFn = (text: string) => {
  const scripts = [];
  let scriptMatch: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: ignore
  while ((scriptMatch = scriptExtractor.exec(text))) {
    for (const importMatch of scriptMatch[1].matchAll(importMatcher)) {
      scripts.push(importMatch);
    }
  }
  return scripts.join(';\n');
};
