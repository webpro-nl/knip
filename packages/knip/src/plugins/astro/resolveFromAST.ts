import type { Program } from 'oxc-parser';
import {
  collectPropertyValues,
  findProperty,
  getPropertyKey,
  getStringValue,
  hasImportSpecifier,
} from '../../typescript/ast-helpers.ts';

export const getSrcDir = (program: Program): string => {
  const values = collectPropertyValues(program, 'srcDir');
  return values.size > 0 ? Array.from(values)[0] : 'src';
};

export const usesPassthroughImageService = (program: Program) =>
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
// Supports `export default { ... }` and `export default defineConfig({ ... })`.
export const getViteAliases = (program: Program): Record<string, string> => {
  const aliases: Record<string, string> = {};
  for (const node of (program as unknown as { body: any[] }).body ?? []) {
    if (node.type !== 'ExportDefaultDeclaration') continue;
    const decl = node.declaration;
    const root =
      decl?.type === 'ObjectExpression'
        ? decl
        : decl?.type === 'CallExpression' && decl.arguments?.[0]?.type === 'ObjectExpression'
          ? decl.arguments[0]
          : undefined;
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
