import type { ConfigArg } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.ts';
import type { ContentMapperManifest, TsConfigJson } from '../../types/tsconfig-json.ts';
import { compact } from '../../util/array.ts';
import { toConfig, toDeferResolve, toDependency, toProductionDependency } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toShellCommand } from '../../util/scripts.ts';

// https://www.typescriptlang.org/tsconfig

const title = 'TypeScript';

const enablers = ['typescript', '@typescript/native', '@typescript/native-preview'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json', 'package.json'];

const packageJsonPath = 'typescript.contentMapper';

const resolveContentMapper = ({ exec }: ContentMapperManifest, options: PluginOptions) => {
  if (!Array.isArray(exec) || exec.some(arg => typeof arg !== 'string')) return [];
  return options
    .getInputsFromScripts(toShellCommand(exec))
    .map(input =>
      input.type === 'entry' || input.type === 'deferResolveEntry' ? { ...input, production: true } : input
    );
};

const resolveTsConfig = (localConfig: TsConfigJson, options: PluginOptions) => {
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

  const contentMappers = localConfig.contentMappers?.map(contentMapper => toDependency(contentMapper.package)) ?? [];

  if (!(compilerOptions && localConfig)) return compact([...contentMappers, ...extend, ...references]);

  const jsx = (compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : []).map(toProductionDependency);

  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];

  return compact([
    ...contentMappers,
    ...extend,
    ...references,
    ...types.map(id => toDeferResolve(id, { isTypeOnly: true, dir: options.cwd })),
    ...[...plugins, ...importHelpers].map(id => toDeferResolve(id)),
    ...jsx,
  ]);
};

const resolveConfig: ResolveConfig<TsConfigJson & ContentMapperManifest> = (localConfig, options) =>
  options.configFileName === 'package.json'
    ? resolveContentMapper(localConfig, options)
    : resolveTsConfig(localConfig, options);

const args = {
  binaries: ['tsc', 'tsgo'],
  string: ['project'],
  alias: { project: ['p'] },
  config: [['project', (p: string) => (p.endsWith('.json') ? p : join(p, 'tsconfig.json'))]] satisfies ConfigArg,
};

const note = `[What's up with that configurable tsconfig.json location?](/reference/faq#whats-up-with-that-configurable-tsconfigjson-location)

In a content mapper package, the command in \`package.json#typescript.contentMapper.exec\` is resolved to a production entry.`;

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  packageJsonPath,
  resolveConfig,
  args,
};

export default plugin;
