import type { Program } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import { blockCommentMatcher, lineCommentMatcher, scriptExtractor } from '../../compilers/compilers.ts';
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

const moduleTypePattern = /\btype\s*=\s*["']?module["']?/i;

const srcAttrPattern = /\bsrc\s*=\s*["']([^"']+)["']/i;

const importSpecPattern = /\bimport\b(?:\s*\(\s*|(?:[\w$*,{}\s]*\bfrom\b)?\s*)(['"])([^'"]+)\1/g;

const isFilePath = (specifier: string) =>
  specifier.startsWith('/') || specifier.startsWith('./') || specifier.startsWith('../');

const normalizeModuleScriptSrc = (value: string) => value.trim().replace(/^\//, '');

const getModuleScriptSources = (html: string): string[] => {
  const sources: string[] = [];

  for (const [, attrs, body] of html.matchAll(scriptExtractor)) {
    if (!moduleTypePattern.test(attrs)) continue;

    const srcMatch = attrs.match(srcAttrPattern);
    if (srcMatch) {
      const src = normalizeModuleScriptSrc(srcMatch[1]);
      if (src) sources.push(src);
      continue;
    }

    if (body) {
      const code = body.replace(blockCommentMatcher, '').replace(lineCommentMatcher, '');
      for (const importMatch of code.matchAll(importSpecPattern)) {
        const specifier = importMatch[2];
        if (isFilePath(specifier)) sources.push(normalizeModuleScriptSrc(specifier));
      }
    }
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
