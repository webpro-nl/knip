import type { SyncCompilerFn } from './types.js';

export const fencedCodeBlockMatcher = /```[\s\S]*?```/g;

// Extract imports from body of <script> nodes
const scriptExtractor = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
export const importMatcher = /import[^'"]+['"]([^'"]+)['"]/g;
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

// Extract body of <script lang="ts"> nodes
const tsScriptExtractor = /<script\b[^>]*lang="ts"[^>]*>(?<body>[\s\S]*?)<\/script>/gm;
export const tsScriptBodies: SyncCompilerFn = (text: string) => {
  const scripts = [];
  let scriptMatch: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: ignore
  while ((scriptMatch = tsScriptExtractor.exec(text))) {
    if (scriptMatch.groups?.body) scripts.push(scriptMatch.groups.body);
  }
  return scripts.join(';\n');
};
