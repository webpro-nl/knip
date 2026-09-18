import type { Program } from 'oxc-parser';
import { blockCommentMatcher, lineCommentMatcher, scriptExtractor } from '../../compilers/compilers.ts';
import { findImportedCalls, findProperty, getStringValues } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { isFile, loadFile } from '../../util/fs.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { dirname, join, toAbsolute } from '../../util/path.ts';
import { getDependenciesFromConfig } from '../babel/index.ts';

const babelPluginSources = ['@rolldown/plugin-babel', '@vitejs/plugin-react', 'vite-plugin-babel'];

const isBabelWrappingPlugin = (path: string) =>
  babelPluginSources.some(source => path === source || path.startsWith(`${source}/`));

export const getBabelInputs = (program: Program): Input[] => {
  const inputs: Input[] = [];
  for (const call of findImportedCalls(program, isBabelWrappingPlugin)) {
    const options = call.arguments?.[0];
    const plugins: string[] = [];
    const presets: string[] = [];
    for (const config of [options, findProperty(options, 'babel'), findProperty(options, 'babelConfig')]) {
      plugins.push(...getStringValues(findProperty(config, 'plugins')));
      presets.push(...getStringValues(findProperty(config, 'presets')));
    }
    inputs.push(...getDependenciesFromConfig({ plugins, presets }));
  }
  return inputs;
};

const moduleTypePattern = /\btype\s*=\s*["']?module["']?/i;

const srcAttrPattern = /\bsrc\s*=\s*["']([^"']+)["']/i;

const importSpecPattern = /\bimport\b(?:\s*\(\s*|(?:[\w$*,{}\s]*\bfrom\b)?\s*)(['"])([^'"]+)\1/g;

const isFilePath = (specifier: string) =>
  specifier.startsWith('/') || specifier.startsWith('./') || specifier.startsWith('../');

const normalizeModuleScriptSrc = (value: string) => value.trim().replace(/^\//, '');

const getScriptSources = (html: string, publicDir?: string): string[] => {
  const sources: string[] = [];

  for (const [, attrs, body] of html.matchAll(scriptExtractor)) {
    const srcMatch = attrs.match(srcAttrPattern);
    if (srcMatch) {
      const src = srcMatch[1].trim();
      if (!src || /^(?:[\w+.-]+:|\/\/)/.test(src)) continue;
      if (publicDir && src.startsWith('/')) {
        const publicPath = join(publicDir, src.split(/[?#]/, 1)[0]);
        if (publicPath.startsWith(join(publicDir, '/')) && isFile(publicPath)) {
          sources.push(publicPath);
          continue;
        }
      }
      if (moduleTypePattern.test(attrs)) sources.push(normalizeModuleScriptSrc(src));
      continue;
    }

    if (moduleTypePattern.test(attrs) && body) {
      const code = body.replace(blockCommentMatcher, '').replace(lineCommentMatcher, '');
      for (const importMatch of code.matchAll(importSpecPattern)) {
        const specifier = importMatch[2];
        if (isFilePath(specifier)) sources.push(normalizeModuleScriptSrc(specifier));
      }
    }
  }

  return sources;
};

export const getHtmlScriptEntries = async (htmlPath: string, publicDir?: string): Promise<Input[]> => {
  if (!isFile(htmlPath)) return [];

  const html = await loadFile(htmlPath);
  const dir = dirname(htmlPath);
  return getScriptSources(html, publicDir).map(src => toProductionEntry(toAbsolute(src, dir)));
};

export const getIndexHtmlEntries = (rootDir: string, publicDir?: string): Promise<Input[]> =>
  getHtmlScriptEntries(join(rootDir, 'index.html'), publicDir);

export const getVitePluginDirs = (program: Program, specifiers: string[], key: string): string[] | undefined => {
  let dirs: string[] | undefined;
  for (const call of findImportedCalls(program, specifiers)) {
    const value = findProperty(call.arguments?.[0], key);
    if (!value) continue;
    const collected: string[] = [];
    const single = getStringValue(value);
    if (single !== undefined) collected.push(single);
    else if (value.type === 'ArrayExpression') {
      for (const element of value.elements ?? []) {
        const str = getStringValue(element);
        if (str !== undefined) collected.push(str);
        else if (element?.type === 'ObjectExpression') {
          const dir = getStringValue(findProperty(element, 'dir'));
          if (dir !== undefined) collected.push(dir);
        }
      }
    }
    if (collected.length > 0) dirs = collected;
  }
  return dirs;
};
