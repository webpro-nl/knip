import type { Program } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import {
  collectFirstPropertyValue,
  findImportedCallArg,
  findProperty,
  getPropertyKey,
  getPropertyValues,
  hasImportSpecifier,
  resolveObjectArg,
} from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { toConfig, toDependency, toEntry, toProductionEntry } from '../../util/input.ts';
import { getAliasInputs } from '../vitest/helpers.ts';

export const entry = ['src/content/config.ts', 'src/content.config.ts'];

export const production = [
  'src/pages/**/*.{astro,mdx,js,ts}',
  '!src/pages/**/_*', // negate files prefixed with _.
  '!src/pages/**/_*/**', // negate folders prefixed with _. The pattern _** would be collapsed into _* so we have to use **/_*/**
  'src/content/**/*.mdx',
  'src/middleware.{js,ts}',
  'src/middleware/index.{js,ts}',
  'src/actions/index.{js,ts}',
];

const getSrcDir = (program: Program): string => collectFirstPropertyValue(program, 'srcDir') ?? 'src';

const usesPassthroughImageService = (program: Program) =>
  hasImportSpecifier(program, 'astro/config', 'passthroughImageService');

// First string literal reachable via CallExpression/NewExpression arguments. Handles common
// config patterns: `'./src'`, `path.resolve('./src')`, `path.resolve(__dirname, 'src')`,
// `fileURLToPath(new URL('./src', import.meta.url))`.
const findFirstStringArg = (node: any): string | undefined => {
  const literal = getStringValue(node);
  if (literal) return literal;
  if (node?.type === 'CallExpression' || node?.type === 'NewExpression') {
    for (const arg of node.arguments ?? []) {
      const found = findFirstStringArg(arg);
      if (found) return found;
    }
  }
};

// Extract `vite.resolve.alias` from the default-exported config object.
// Supports `export default { ... }`, `export default defineConfig({ ... })`,
// and `export default defineConfig(() => ({ ... }))`.
const getViteAliases = (program: Program): Record<string, string> => {
  const aliases: Record<string, string> = {};
  for (const node of (program as unknown as { body: any[] }).body ?? []) {
    if (node.type !== 'ExportDefaultDeclaration') continue;
    const decl = node.declaration;
    const root = decl?.type === 'CallExpression' ? resolveObjectArg(decl.arguments?.[0]) : resolveObjectArg(decl);
    const aliasNode = findProperty(findProperty(findProperty(root, 'vite'), 'resolve'), 'alias');
    if (aliasNode?.type !== 'ObjectExpression') continue;
    for (const prop of aliasNode.properties ?? []) {
      if (prop.type !== 'Property') continue;
      const key = getPropertyKey(prop);
      if (!key) continue;
      const raw = findFirstStringArg(prop.value);
      if (raw) aliases[key] = raw;
    }
  }
  return aliases;
};

export const resolveFromAST: ResolveFromAST = (program, options) => {
  const srcDir = getSrcDir(program);
  const setSrcDir = (entry: string) => entry.replace(/^src\//, `${srcDir}/`);
  const inputs = [
    ...entry.map(setSrcDir).map(path => toEntry(path)),
    ...production.map(setSrcDir).map(path => toProductionEntry(path)),
    ...getAliasInputs(getViteAliases(program), options.cwd),
  ];

  if (!usesPassthroughImageService(program)) inputs.push(toDependency('sharp', { optional: true }));

  const lunariaConfig = findImportedCallArg(program, '@lunariajs/starlight');
  if (lunariaConfig) {
    for (const id of getPropertyValues(lunariaConfig, 'configPath')) {
      inputs.push(toConfig('lunaria', id));
    }
  }

  return inputs;
};
