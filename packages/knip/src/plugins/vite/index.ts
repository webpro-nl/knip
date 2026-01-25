import type ts from 'typescript';
import type { Args } from '../../types/args.js';
import type {
  IsPluginEnabled,
  Plugin,
  Resolve,
  ResolveFromAST,
} from '../../types/config.js';
import {
  type Input,
  toDependency,
  toProductionEntry,
} from '../../util/input.js';
import { isFile, loadFile } from '../../util/fs.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { resolveConfig } from '../vitest/index.js';
import { getReactBabelPlugins } from './helpers.js';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite', 'vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

export const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const moduleScriptPattern =
  /<script\b(?=[^>]*\btype\s*=\s*["']?module["']?)(?=[^>]*\bsrc\s*=\s*["']?([^"' >]+)["']?)[^>]*>/gi;

const normalizeModuleScriptSrc = (value: string) =>
  value.trim().replace(/^\//, '');

const getModuleScriptSources = (html: string): string[] => {
  const matches = html.matchAll(moduleScriptPattern);
  const sources = [];

  for (const match of matches) {
    const src = normalizeModuleScriptSrc(match[1]);
    if (src) sources.push(src);
  }

  return sources;
};

const getIndexHtmlEntries = async (rootDir: string): Promise<Input[]> => {
  const indexPath = join(rootDir, 'index.html');
  if (!isFile(indexPath)) return [];

  const html = await loadFile(indexPath);
  const entries = getModuleScriptSources(html).map(src => join(rootDir, src));
  return entries.map(entry => toProductionEntry(entry));
};

const resolveFromAST: ResolveFromAST = (sourceFile: ts.SourceFile) => {
  const babelPlugins = getReactBabelPlugins(sourceFile);
  return babelPlugins.map(plugin => toDependency(plugin));
};

const resolve: Resolve = async options => {
  return getIndexHtmlEntries(options.cwd);
};

const args: Args = {
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  resolveFromAST,
  resolve,
  args,
};

export default plugin;
