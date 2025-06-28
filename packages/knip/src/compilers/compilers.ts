import type { SyncCompilerFn } from './types.js';

export const fencedCodeBlockMatcher = /```[\s\S]*?```/g;

// Extract imports from body of <script> nodes
const scriptExtractor = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
export const importMatcher = /import[^'"]+['"][^'"]+['"]/g;
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

// Extract body of <script>、<script lang="ts">、<script setup>、<script lang="ts" setup> etc. nodes
const scriptBodyExtractor = /<script\b[^>]*>(?<body>[\s\S]*?)<\/script>/gm;
export const scriptBodies: SyncCompilerFn = (text: string) => {
  const scripts = [];
  let scriptMatch: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: ignore
  while ((scriptMatch = scriptBodyExtractor.exec(text))) {
    if (scriptMatch.groups?.body) scripts.push(scriptMatch.groups.body);
  }
  return scripts.join(';\n');
};

// Extract paths as imports from frontmatter for given keys (e.g., 'layout')
const frontmatterMatcher = /---[\s\S]*?---/;
export const importsWithinFrontmatter = (text: string, keys: string[] = []) => {
  const frontmatter = text.match(frontmatterMatcher)?.[0];
  if (!frontmatter) return '';

  const imports = keys.flatMap(key => {
    const valueMatcher = new RegExp(`${key}:\\s*["']([^"']+)["']`, 'i');
    const match = frontmatter.match(valueMatcher);
    return match?.[1] ? [`import ${key} from "${match[1]}";`] : [];
  });
  return imports.join('\n');
};
