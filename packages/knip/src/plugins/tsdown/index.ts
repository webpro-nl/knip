import type { Args } from '../../types/args.ts';
import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toDependency, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { Entry, Options, TsdownConfig } from './types.ts';

// https://github.com/rolldown/tsdown/blob/main/src/options/index.ts

const title = 'tsdown';

const enablers = ['tsdown'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsdown.config.{ts,mts,cts,js,mjs,cjs,json}', 'package.json'];

const sourcemapModes = new Set(['inline', 'hidden']);
const subcommands = new Set(['create', 'migrate']);

const isLoadConfig: IsLoadConfig = ({ configFileName }) =>
  configFileName === 'package.json' || configFileName.endsWith('.json');

const normalizeEntry = (entry: Entry | undefined): string[] => {
  if (!entry) return [];

  if (typeof entry === 'string') {
    return [entry];
  }

  if (Array.isArray(entry)) {
    return entry.flatMap(normalizeEntry);
  }

  return Object.values(entry).flatMap(value => (Array.isArray(value) ? value : [value]));
};

const getExternalDependencies = (options: Options): string[] => {
  const neverBundle = options.deps?.neverBundle;
  const values = Array.isArray(neverBundle) ? neverBundle : [neverBundle];
  return values.filter(value => typeof value === 'string');
};

const resolveConfig: ResolveConfig<TsdownConfig> = async config => {
  if (typeof config === 'function') config = await config({});

  const entryPatterns = [config]
    .flat()
    .flatMap(config => normalizeEntry(config.entry))
    .map(id => toProductionEntry(id, { allowIncludeExports: true }));

  const externalDependencies = [config]
    .flat()
    .flatMap(getExternalDependencies)
    .map(id => toDependency(id, { optional: true }));

  return [...entryPatterns, ...externalDependencies];
};

const resolveFromAST: ResolveFromAST = program => [
  ...[...collectPropertyValues(program, 'entry')].map(id => toProductionEntry(id, { allowIncludeExports: true })),
  ...[...collectPropertyValues(program, 'neverBundle')].map(id => toDependency(id, { optional: true })),
];

const args: Args = {
  config: true,
  args: args => {
    if (subcommands.has(args[0])) return [];
    return args.filter((arg, index) => {
      const previous = args[index - 1];
      if (previous === '--sourcemap' && sourcemapModes.has(arg)) return false;
      return previous !== '--watch' || arg.startsWith('-');
    });
  },
  boolean: [
    'attw',
    'clean',
    'deps.skip-node-modules-bundle',
    'deps.skipNodeModulesBundle',
    'devtools',
    'dts',
    'exe',
    'exports',
    'fail-on-warn',
    'failOnWarn',
    'minify',
    'publint',
    'report',
    'shims',
    'silent',
    'sourcemap',
    'treeshake',
    'unbundle',
    'unused',
    'write',
  ],
  resolveInputs: parsed => [
    ...[...parsed._, ...normalizeEntry(parsed.entry)].map(id => toProductionEntry(id, { allowIncludeExports: true })),
    ...[parsed.deps?.neverBundle, parsed.deps?.['never-bundle'], parsed.external]
      .flat()
      .filter(id => typeof id === 'string')
      .map(id => toDependency(id, { optional: true })),
    ...(parsed.publint ? [toDependency('publint', { optional: true })] : []),
    ...(parsed.attw ? [toDependency('@arethetypeswrong/core', { optional: true })] : []),
  ],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
  args,
};

export default plugin;
