import type { Program } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import {
  collectFirstPropertyValue,
  findCallArg,
  findProperty,
  getFirstPropertyValue,
  hasImportSpecifier,
} from '../../typescript/ast-helpers.ts';
import { _parseFile } from '../../typescript/ast-nodes.ts';
import { _syncGlob } from '../../util/glob.ts';
import { toAlias, toIgnore, toProductionEntry } from '../../util/input.ts';
import { config as viteConfig } from '../vite/index.ts';

const production = [
  'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
  'src/hooks.{server,client}.{js,ts}',
  'src/params/*.{js,ts}',
  'src/service-worker.{js,ts}',
  'src/service-worker/index.{js,ts}',
  'src/instrumentation.server.{js,ts}',
];

/**
 * SvelteKit ignores `svelte.config.js` when options are passed to `sveltekit()`, so prefer the Vite config.
 * @see https://github.com/sveltejs/kit/blob/8fe845d036850e506f437cae0fb034c87d1e5b83/packages/kit/src/exports/vite/index.js#L149-L172
 */
const isConfigInViteConfig = (dir: string, readFile: (filePath: string) => string): boolean => {
  for (const filePath of _syncGlob({ cwd: dir, patterns: viteConfig })) {
    const text = readFile(filePath);
    if (text && findCallArg(_parseFile(filePath, text).program, 'sveltekit')) return true;
  }
  return false;
};

const getLibFromViteConfig = (program: Program): string => {
  const call = findCallArg(program, 'sveltekit');
  const files = call ? findProperty(call, 'files') : undefined;
  return (files && getFirstPropertyValue(files, 'lib')) ?? 'src/lib';
};

const getLibFromSvelteConfig = (program: Program): string => collectFirstPropertyValue(program, 'lib') ?? 'src/lib';

const toInputs = (lib: string) => [
  ...production.map(pattern => toProductionEntry(pattern)),
  toAlias('$lib', [`./${lib}`]),
  toAlias('$lib/*', [`./${lib}/*`]),
  toIgnore('\\$app/.+', 'unresolved'),
  toIgnore('\\$env/.+', 'unresolved'),
  toIgnore('\\$service-worker', 'unresolved'),
];

export const resolveFromAST: ResolveFromAST = (program, options) => {
  if (options.configFileName.startsWith('vite.config')) {
    if (!hasImportSpecifier(program, '@sveltejs/kit/vite', 'sveltekit')) return [];
    return toInputs(getLibFromViteConfig(program));
  }
  if (isConfigInViteConfig(options.configFileDir, options.readFile)) return [];
  return toInputs(getLibFromSvelteConfig(program));
};
