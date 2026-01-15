import type { ConfigArg } from '../../types/args.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { TsConfigJson } from '../../types/tsconfig-json.js';
import { compact } from '../../util/array.js';
import { toAlias, toConfig, toDeferResolve, toProductionDependency } from '../../util/input.js';
import { dirname, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';

// https://www.typescriptlang.org/tsconfig

const title = 'TypeScript';

const enablers = ['typescript'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json'];

const resolveConfig: ResolveConfig<TsConfigJson> = async (localConfig, options) => {
  const { compilerOptions } = localConfig;

  const extend = localConfig.extends
    ? [localConfig.extends]
        .flat()
        .map(specifier => toConfig('typescript', specifier, { containingFilePath: options.configFilePath }))
    : [];

  const references =
    localConfig.references
      ?.filter(reference => reference.path.endsWith('.json'))
      .map(reference => toConfig('typescript', reference.path, { containingFilePath: options.configFilePath })) ?? [];

  if (!(compilerOptions && localConfig)) return compact([...extend, ...references]);

  const jsx = (compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : []).map(toProductionDependency);

  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];

  const paths = compilerOptions.paths as Record<string, string[]> | undefined;
  const configFileDir = dirname(options.configFilePath);
  const aliases =
    paths && configFileDir !== options.cwd
      ? Object.entries(paths).map(([key, prefixes]) =>
          toAlias(key, prefixes, { dir: join(configFileDir, (compilerOptions.baseUrl as string) ?? '.') })
        )
      : [];

  return compact([
    ...extend,
    ...references,
    ...[...types, ...plugins, ...importHelpers].map(id => toDeferResolve(id)),
    ...jsx,
    ...aliases,
  ]);
};

const args = {
  binaries: ['tsc'],
  string: ['project'],
  alias: { project: ['p'] },
  config: [['project', (p: string) => (p.endsWith('.json') ? p : join(p, 'tsconfig.json'))]] satisfies ConfigArg,
};

const note =
  "[What's up with that configurable tsconfig.json location?](/reference/faq#whats-up-with-that-configurable-tsconfigjson-location)";

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;
