import MDX from '../../compilers/mdx.ts';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, RegisterCompilers, Resolve, ResolveConfig } from '../../types/config.ts';
import { type Input, toAlias, toDependency, toEntry, toEntryPath, toIgnore, toModule } from '../../util/input.ts';
import { join, toAbsolute, toPosix } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { configParams, resolveConfig as resolveRsbuildConfig } from '../rsbuild/index.ts';
import type { RspressConfig, RspressConfigOrFn } from './types.ts';

// https://rspress.rs/api/config/config-basic
// https://github.com/web-infra-dev/rspress/blob/21f16c8d08d1d79e30528c307a4a1201beb93914/packages/shared/src/constants.ts#L1-L23
// https://github.com/web-infra-dev/rspress/blob/21f16c8d08d1d79e30528c307a4a1201beb93914/packages/core/src/cli/index.ts#L24-L181
// https://github.com/web-infra-dev/rspress/blob/21f16c8d08d1d79e30528c307a4a1201beb93914/packages/core/src/config/loadConfigFile.ts#L45-L60
// https://github.com/web-infra-dev/rspress/blob/21f16c8d08d1d79e30528c307a4a1201beb93914/packages/core/src/node/route/RouteService.ts#L118-L169
// https://github.com/web-infra-dev/rspress/blob/21f16c8d08d1d79e30528c307a4a1201beb93914/packages/core/src/node/initRsbuild.ts#L293-L301

const title = 'Rspress';

const enablers = ['@rspress/core', 'rspress'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rspress.config.{js,ts,mjs,mts,cjs,cts}'];

const defaultPageExtensions = ['js', 'jsx', 'ts', 'tsx', 'mdx'];
const defaultExcludeConvention = ['**/_[^_]*'];

const getDocPatterns = (
  extensions: string[] = defaultPageExtensions,
  include: string[] = [],
  exclude: string[] = [],
  excludeConvention: string[] = defaultExcludeConvention
) => {
  const exts: string[] = [];
  for (const ext of extensions) {
    const normalized = ext.startsWith('.') ? ext.slice(1) : ext;
    if (normalized && normalized !== 'md') exts.push(normalized);
  }
  const patterns: string[] = [];
  if (exts.length > 0) patterns.push(exts.length === 1 ? `**/*.${exts[0]}` : `**/*.{${exts.join(',')}}`);
  for (const pattern of include) patterns.push(pattern);
  for (const pattern of exclude) patterns.push(pattern.startsWith('!') ? pattern : `!${pattern}`);
  for (const pattern of excludeConvention) patterns.push(pattern.startsWith('!') ? pattern : `!${pattern}`);
  patterns.push('!public/**', '!**/*.d.ts');
  return patterns;
};

const production = [
  `docs/**/*.{${defaultPageExtensions.join(',')}}`,
  '!docs/**/_[^_]*',
  '!docs/public/**',
  '!docs/**/*.d.ts',
  'theme/index.{js,jsx,ts,tsx,mjs}',
];

const args: Args = {
  config: true,
};

const getConfigs = async (configOrFn: RspressConfigOrFn) => {
  if (typeof configOrFn !== 'function') return [await configOrFn];
  const configs: RspressConfig[] = [];
  for (const params of configParams) {
    const localConfig = await configOrFn(params);
    if (localConfig) configs.push(localConfig);
  }
  return configs;
};

const resolve: Resolve = () => [
  toDependency('react', { optional: true, production: true }),
  toDependency('react-dom', { optional: true, production: true }),
  toIgnore('^@theme(-original)?(/|$)', 'dependencies'),
];

const resolveConfig: ResolveConfig<RspressConfigOrFn> = async (configOrFn, options) => {
  const inputs: Input[] = [];

  for (const localConfig of await getConfigs(configOrFn)) {
    if (!localConfig || typeof localConfig !== 'object') continue;

    const root = localConfig.root ? toAbsolute(toPosix(localConfig.root), options.cwd) : join(options.cwd, 'docs');
    const route = localConfig.route;
    for (const pattern of getDocPatterns(route?.extensions, route?.include, route?.exclude, route?.excludeConvention)) {
      inputs.push(toEntry(pattern, { dir: root, production: true }));
    }

    const themeDir = localConfig.themeDir
      ? toAbsolute(toPosix(localConfig.themeDir), options.cwd)
      : join(options.cwd, 'theme');
    inputs.push(toEntry('index.{js,jsx,ts,tsx,mjs}', { dir: themeDir, production: true }));
    inputs.push(toAlias('@theme', `${themeDir}/index`, { dir: options.cwd }));
    inputs.push(toAlias('@theme/*', `${themeDir}/*`, { dir: options.cwd }));

    if (localConfig.globalStyles) {
      inputs.push(toEntryPath(toPosix(localConfig.globalStyles), { dir: options.cwd, production: true }));
    }

    if (localConfig.globalUIComponents) {
      for (const component of localConfig.globalUIComponents) {
        const specifier = Array.isArray(component) ? component[0] : component;
        if (typeof specifier === 'string') {
          inputs.push(toModule(toPosix(specifier), { dir: options.cwd, production: true }));
        }
      }
    }

    const globalComponents = localConfig.markdown?.globalComponents;
    if (globalComponents) {
      for (const component of globalComponents) {
        if (typeof component === 'string') {
          inputs.push(toEntryPath(toPosix(component), { dir: options.cwd, production: true }));
        }
      }
    }

    const search = localConfig.search;
    if (search && typeof search === 'object' && search.searchHooks) {
      inputs.push(toEntryPath(toPosix(search.searchHooks), { dir: options.cwd, production: true }));
    }

    if (localConfig.builderConfig) {
      for (const input of await resolveRsbuildConfig(localConfig.builderConfig, options)) {
        inputs.push(input);
      }
    }
  }

  return inputs;
};

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('@rspress/core') || hasDependency('rspress')) {
    registerCompiler({ extension: '.mdx', compiler: MDX.compiler });
  }
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  args,
  resolve,
  resolveConfig,
  registerCompilers,
};

export default plugin;
