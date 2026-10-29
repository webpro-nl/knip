import type { ConfigArg } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { TsConfigJson } from '../../types/tsconfig-json.ts';
import { compact } from '../../util/array.ts';
import { type Input, toConfig, toDeferResolve, toDependency, toProductionDependency } from '../../util/input.ts';
import { join, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { contentMapperResolvers } from './content-mappers.ts';

// https://www.typescriptlang.org/tsconfig

const title = 'TypeScript';

const enablers = ['typescript', '@typescript/native', '@typescript/native-preview'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['tsconfig.json'];

const resolveContentMappers = (localConfig: TsConfigJson) => {
  const inputs: Input[] = [];
  for (const { package: name, options } of localConfig.contentMappers ?? []) {
    inputs.push(toDependency(name));
    const resolveOptions = contentMapperResolvers.get(name);
    if (resolveOptions && options) inputs.push(...resolveOptions(options));
  }
  return inputs;
};

export const resolveConfig: ResolveConfig<TsConfigJson> = (localConfig, options) => {
  const { compilerOptions } = localConfig;

  const extend = localConfig.extends
    ? [localConfig.extends].flat().map(specifier => toConfig(options.pluginName, specifier))
    : [];

  const references =
    localConfig.references?.map(({ path }) =>
      toConfig(
        options.pluginName,
        path.endsWith('.json') ? path : toAbsolute(join(path, 'tsconfig.json'), options.configFileDir)
      )
    ) ?? [];

  const contentMappers = resolveContentMappers(localConfig);

  if (!(compilerOptions && localConfig)) return compact([...contentMappers, ...extend, ...references]);

  const jsx = (compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : []).map(id => ({
    ...toProductionDependency(id),
    dir: options.cwd,
    alsoReferenceOwner: true,
  }));

  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];

  return compact([
    ...contentMappers,
    ...extend,
    ...references,
    ...types.map(id => toDeferResolve(id, { isTypeOnly: true, dir: options.cwd, alsoReferenceOwner: true })),
    ...[...plugins, ...importHelpers].map(id => toDeferResolve(id, { dir: options.cwd, alsoReferenceOwner: true })),
    ...jsx,
  ]);
};

export const args = {
  binaries: ['tsc', 'tsgo'],
  string: ['project'],
  alias: { project: ['p'] },
  config: [['project', (p: string) => (p.endsWith('.json') ? p : join(p, 'tsconfig.json'))]] satisfies ConfigArg,
};

const note = `[What's up with that configurable tsconfig.json location?](/reference/faq#whats-up-with-that-configurable-tsconfigjson-location)`;

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
