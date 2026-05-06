import type { Program } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import { findProperty, getDefaultImportName, getImportMap, getStringValues } from '../../typescript/ast-helpers.ts';
import { isFile, loadFile } from '../../util/fs.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';

const unwrap = (node: any): any => (node?.type === 'ParenthesizedExpression' ? unwrap(node.expression) : node);

// Resolve a defineConfig argument to its ObjectExpression: handles object form, arrow/function with
// implicit object return, and arrow/function with a single inline `return { ... }` block.
const resolveConfigObject = (arg: any): any | undefined => {
  const node = unwrap(arg);
  if (!node) return;
  if (node.type === 'ObjectExpression') return node;
  if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression') return;
  const body = unwrap(node.body);
  if (body?.type === 'ObjectExpression') return body;
  if (body?.type !== 'BlockStatement') return;
  for (const stmt of body.body ?? []) {
    if (stmt.type === 'ReturnStatement') {
      const ret = unwrap(stmt.argument);
      if (ret?.type === 'ObjectExpression') return ret;
    }
  }
};

export const getReactBabelInputs = (program: Program): string[] => {
  const inputs: string[] = [];

  const importMap = getImportMap(program);
  const reactPluginNames = new Set<string>();

  for (const [importName, importPath] of importMap) {
    if (importPath.includes('@vitejs/plugin-react')) reactPluginNames.add(importName);
  }

  if (reactPluginNames.size === 0) {
    const defaultImportName = getDefaultImportName(importMap, '@vitejs/plugin-react');
    if (defaultImportName) reactPluginNames.add(defaultImportName);
    else reactPluginNames.add('react');
  }

  const visitor = new Visitor({
    CallExpression(node) {
      if (node.callee?.type !== 'Identifier' || node.callee.name !== 'defineConfig') return;
      const config = resolveConfigObject(node.arguments?.[0]);
      const plugins = findProperty(config, 'plugins');
      if (plugins?.type !== 'ArrayExpression') return;

      for (const el of plugins.elements ?? []) {
        if (el?.type !== 'CallExpression' || el.callee?.type !== 'Identifier') continue;
        if (!reactPluginNames.has(el.callee.name)) continue;

        const babel = findProperty(el.arguments?.[0], 'babel');
        for (const key of ['plugins', 'presets']) {
          for (const v of getStringValues(findProperty(babel, key))) inputs.push(v);
        }
      }
    },
  });
  visitor.visit(program);

  return inputs;
};

const moduleScriptPattern =
  /<script\b(?=[^>]*\btype\s*=\s*["']?module["']?)(?=[^>]*\bsrc\s*=\s*["']?([^"' >]+)["']?)[^>]*>/gi;

const normalizeModuleScriptSrc = (value: string) => value.trim().replace(/^\//, '');

const getModuleScriptSources = (html: string): string[] => {
  const matches = html.matchAll(moduleScriptPattern);
  const sources = [];

  for (const match of matches) {
    const src = normalizeModuleScriptSrc(match[1]);
    if (src) sources.push(src);
  }

  return sources;
};

export const getIndexHtmlEntries = async (rootDir: string): Promise<Input[]> => {
  const indexPath = join(rootDir, 'index.html');
  if (!isFile(indexPath)) return [];

  const html = await loadFile(indexPath);
  const entries = getModuleScriptSources(html).map(src => join(rootDir, src));
  return entries.map(entry => toProductionEntry(entry));
};
