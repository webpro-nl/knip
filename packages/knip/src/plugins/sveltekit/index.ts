import type { Program } from 'oxc-parser';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { toAlias, toIgnore, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { join } from '../../util/path.ts';
import { config as viteConfig } from '../vite/index.ts';
import {
  collectPropertyValues,
  findCallArg,
  findProperty,
  getPropertyValues,
  hasImportSpecifier,
} from '../../typescript/ast-helpers.ts';
import { _parseFile } from '../../typescript/ast-nodes.ts';

// https://svelte.dev/docs/kit

const title = 'SvelteKit';

const enablers = ['@sveltejs/kit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['svelte.config.js', ...viteConfig];

const production = [
  'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
  'src/hooks.{server,client}.{js,ts}',
  'src/params/*.{js,ts}',
  'src/service-worker.{js,ts}',
  'src/service-worker/index.{js,ts}',
  'src/instrumentation.server.{js,ts}',
];

const viteConfigFiles = [
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
  'vite.config.cjs',
  'vite.config.mts',
  'vite.config.cts',
];

/**
 * SvelteKit ignores `svelte.config.js` when options are passed to `sveltekit()`, so prefer the Vite config.
 * @see https://github.com/sveltejs/kit/blob/8fe845d036850e506f437cae0fb034c87d1e5b83/packages/kit/src/exports/vite/index.js#L149-L172
 */
const isConfigInViteConfig = (dir: string, readFile: (filePath: string) => string): boolean => {
  for (const name of viteConfigFiles) {
    const text = readFile(join(dir, name));
    if (text && findCallArg(_parseFile(name, text).program, 'sveltekit')) return true;
  }
  return false;
};

const getLibFromViteConfig = (program: Program): string => {
  const call = findCallArg(program, 'sveltekit');
  const files = call ? findProperty(call, 'files') : undefined;
  const values = files ? getPropertyValues(files, 'lib') : new Set<string>();
  return values.size > 0 ? Array.from(values)[0] : 'src/lib';
};

const getLibFromSvelteConfig = (program: Program): string => {
  const values = collectPropertyValues(program, 'lib');
  return values.size > 0 ? Array.from(values)[0] : 'src/lib';
};

const toInputs = (lib: string) => [
  ...production.map(pattern => toProductionEntry(pattern)),
  toAlias('$lib', [`./${lib}`]),
  toAlias('$lib/*', [`./${lib}/*`]),
  toIgnore('\\$app/.+', 'unresolved'),
  toIgnore('\\$env/.+', 'unresolved'),
  toIgnore('\\$service-worker', 'unresolved'),
];

const resolveFromAST: ResolveFromAST = (program, options) => {
  if (options.configFileName.startsWith('vite.config')) {
    if (!hasImportSpecifier(program, '@sveltejs/kit/vite', 'sveltekit')) return [];
    return toInputs(getLibFromViteConfig(program));
  }
  if (isConfigInViteConfig(options.configFileDir, options.readFile)) return [];
  return toInputs(getLibFromSvelteConfig(program));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
