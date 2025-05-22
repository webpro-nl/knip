import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { type Input, toAlias, toDeferResolve, toDependency, toEntry } from '../../util/input.js';
import { join, toPosix } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getEnvPackageName, getExternalReporters } from './helpers.js';
import type { AliasOptions, COMMAND, MODE, ViteConfig, ViteConfigOrFn, VitestWorkspaceConfig } from './types.js';

// https://vitest.dev/config/

const title = 'Vitest';

const enablers = ['vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vitest.config.{js,mjs,ts,cjs,mts,cts}', 'vitest.{workspace,projects}.{js,mjs,ts,cjs,mts,cts,json}'];

const mocks = ['**/__mocks__/**/*.[jt]s?(x)'];

const entry = ['**/*.{bench,test,test-d,spec}.?(c|m)[jt]s?(x)', ...mocks];

const isVitestCoverageCommand = /vitest(.+)--coverage(?:\.enabled(?:=true)?)?/;

const hasScriptWithCoverage = (scripts: PackageJson['scripts']) =>
  scripts
    ? Object.values(scripts).some(script => {
        return isVitestCoverageCommand.test(script);
      })
    : false;

const findConfigDependencies = (localConfig: ViteConfig, options: PluginOptions) => {
  const { manifest, cwd: dir } = options;
  const testConfig = localConfig.test;

  if (!testConfig) return [];

  const environments =
    testConfig.environment && testConfig.environment !== 'node' ? [getEnvPackageName(testConfig.environment)] : [];
  const reporters = getExternalReporters(testConfig.reporters);

  const hasCoverageEnabled =
    (testConfig.coverage && testConfig.coverage.enabled !== false) || hasScriptWithCoverage(manifest.scripts);
  const coverage = hasCoverageEnabled ? [`@vitest/coverage-${testConfig.coverage?.provider ?? 'v8'}`] : [];

  const setupFiles = [testConfig.setupFiles ?? []].flat().map(specifier => ({ ...toDeferResolve(specifier), dir }));
  const globalSetup = [testConfig.globalSetup ?? []].flat().map(specifier => ({ ...toDeferResolve(specifier), dir }));

  const workspaceDependencies: Input[] = [];
  if (testConfig.workspace !== undefined) {
    for (const workspaceConfig of testConfig.workspace) {
      workspaceDependencies.push(...findConfigDependencies(workspaceConfig, options));
    }
  }

  return [
    ...[...environments, ...reporters, ...coverage].map(id => toDependency(id)),
    ...setupFiles,
    ...globalSetup,
    ...workspaceDependencies,
  ];
};

const getConfigs = async (localConfig: ViteConfigOrFn | VitestWorkspaceConfig) => {
  const configs: ViteConfig[] = [];
  for (const config of [localConfig].flat()) {
    if (config && typeof config !== 'string') {
      if (typeof config === 'function') {
        for (const command of ['dev', 'serve', 'build'] as COMMAND[]) {
          for (const mode of ['development', 'production'] as MODE[]) {
            const cfg = await config({ command, mode, ssrBuild: undefined });
            configs.push(cfg);
          }
        }
      } else {
        configs.push(config);
      }
    }
  }
  return configs;
};

export const resolveConfig: ResolveConfig<ViteConfigOrFn | VitestWorkspaceConfig> = async (localConfig, options) => {
  const inputs = new Set<Input>();

  inputs.add(toEntry(join(options.cwd, 'src/vite-env.d.ts')));

  const configs = await getConfigs(localConfig);

  const addStar = (value: string) => (value.endsWith('*') ? value : join(value, '*').replace(/\/\*\*$/, '/*'));
  const addAliases = (aliasOptions: AliasOptions) => {
    for (const [alias, value] of Object.entries(aliasOptions)) {
      if (!value) continue;
      const prefixes = [value]
        .flat()
        .filter(value => typeof value === 'string')
        .map(prefix => {
          if (toPosix(prefix).startsWith(options.cwd)) return prefix;
          return join(options.cwd, prefix);
        });
      if (alias.length > 1) inputs.add(toAlias(alias, prefixes));
      inputs.add(toAlias(addStar(alias), prefixes.map(addStar)));
    }
  };

  for (const cfg of configs) {
    const dir = join(options.cwd, cfg.test?.root ?? '.');

    if (cfg.test) {
      if (cfg.test?.include) {
        for (const dependency of cfg.test.include) dependency[0] !== '!' && inputs.add(toEntry(join(dir, dependency)));
        if (!options.config.entry) for (const dependency of mocks) inputs.add(toEntry(join(dir, dependency)));
      } else {
        for (const dependency of options.config.entry ?? entry) inputs.add(toEntry(join(dir, dependency)));
      }

      if (cfg.test.alias) addAliases(cfg.test.alias);
    }

    if (cfg.resolve?.alias) addAliases(cfg.resolve.alias);

    for (const dependency of findConfigDependencies(cfg, options)) inputs.add(dependency);
    const _entry = cfg.build?.lib?.entry ?? [];
    const deps = (typeof _entry === 'string' ? [_entry] : Object.values(_entry))
      .map(specifier => join(dir, specifier))
      .map(id => toEntry(id));
    for (const dependency of deps) inputs.add(dependency);
  }

  return Array.from(inputs);
};

const args = {
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  args,
} satisfies Plugin;
