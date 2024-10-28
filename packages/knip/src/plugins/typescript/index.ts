import type { TsConfigJson } from 'type-fest';
import type { ConfigArg } from '../../types/args.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { toConfig, toDeferResolve, toProductionDependency } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';

// https://www.typescriptlang.org/tsconfig

const title = 'TypeScript';

const enablers = ['typescript'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json'];

const production: string[] = [];

const resolveConfig: ResolveConfig<TsConfigJson> = async (localConfig, options) => {
  const { compilerOptions } = localConfig;

  const extend = localConfig.extends
    ? [localConfig.extends].flat().map(specifier => toConfig('typescript', specifier, options.configFilePath))
    : [];

  const references =
    localConfig.references
      ?.filter(reference => reference.path.endsWith('.json'))
      .map(reference => toConfig('typescript', reference.path, options.configFilePath)) ?? [];

  if (!(compilerOptions && localConfig)) return compact([...extend, ...references]);

  const jsx = (compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : []).map(toProductionDependency);

  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];

  return compact([...extend, ...references, ...[...types, ...plugins, ...importHelpers].map(toDeferResolve), ...jsx]);
};

const args = {
  binaries: ['tsc'],
  string: ['project'],
  alias: { project: ['p'] },
  config: [['project', (p: string) => (p.endsWith('.json') ? p : join(p, 'tsconfig.json'))]] satisfies ConfigArg,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
  args,
} satisfies Plugin;
