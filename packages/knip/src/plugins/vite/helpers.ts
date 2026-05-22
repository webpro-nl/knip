import type { Program } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import { findProperty, getImportMap, getStringValues } from '../../typescript/ast-helpers.ts';
import { isFile, loadFile } from '../../util/fs.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { getDependenciesFromConfig } from '../babel/index.ts';

const babelPluginSources = ['@rolldown/plugin-babel', '@vitejs/plugin-react', 'vite-plugin-babel'];

const isBabelWrappingPlugin = (path: string) =>
  babelPluginSources.some(source => path === source || path.startsWith(`${source}/`));

export const getBabelInputs = (program: Program): Input[] => {
  const pluginNames = new Set<string>();
  for (const [name, path] of getImportMap(program)) {
    if (isBabelWrappingPlugin(path)) pluginNames.add(name);
  }
  if (pluginNames.size === 0) return [];

  const inputs: Input[] = [];
  const visitor = new Visitor({
    CallExpression(node) {
      if (node.callee?.type !== 'Identifier' || !pluginNames.has(node.callee.name)) return;
      const options = node.arguments?.[0];
      const plugins: string[] = [];
      const presets: string[] = [];
      for (const config of [options, findProperty(options, 'babel'), findProperty(options, 'babelConfig')]) {
        plugins.push(...getStringValues(findProperty(config, 'plugins')));
        presets.push(...getStringValues(findProperty(config, 'presets')));
      }
      inputs.push(...getDependenciesFromConfig({ plugins, presets }));
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
