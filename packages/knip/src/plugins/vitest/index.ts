import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { type Input, toDeferResolve, toDependency, toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getEnvPackageName, getExternalReporters } from './helpers.js';
import type { COMMAND, MODE, ViteConfig, ViteConfigOrFn, VitestWorkspaceConfig } from './types.js';

// https://vitest.dev/config/

const title = 'Vitest';

const enablers = ['vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vitest.config.{js,mjs,ts,cjs,mts,cts}', 'vitest.{workspace,projects}.{js,mjs,ts,cjs,mts,cts,json}'];

const entry = ['**/*.{bench,test,test-d,spec}.?(c|m)[jt]s?(x)'];

const isVitestCoverageCommand = /vitest(.+)--coverage(?:\.enabled(?:=true)?)?/;

const hasScriptWithCoverage = (scripts: PackageJson['scripts']) =>
  scripts
    ? Object.values(scripts).some(script => {
        return isVitestCoverageCommand.test(script);
      })
    : false;

const findConfigDependencies = (localConfig: ViteConfig, options: PluginOptions) => {
  const { manifest, configFileDir } = options;
  const testConfig = localConfig.test;

  if (!testConfig) return [];

  const environments =
    testConfig.environment && testConfig.environment !== 'node' ? [getEnvPackageName(testConfig.environment)] : [];
  const reporters = getExternalReporters(testConfig.reporters);

  const hasCoverageEnabled =
    (testConfig.coverage && testConfig.coverage.enabled !== false) || hasScriptWithCoverage(manifest.scripts);
  const coverage = hasCoverageEnabled ? [`@vitest/coverage-${testConfig.coverage?.provider ?? 'v8'}`] : [];

  const dir = join(configFileDir, testConfig.root ?? '.');
  const setupFiles = [testConfig.setupFiles ?? []].flat().map(specifier => ({ ...toDeferResolve(specifier), dir }));
  const globalSetup = [testConfig.globalSetup ?? []].flat().map(specifier => ({ ...toDeferResolve(specifier), dir }));

  return [...[...environments, ...reporters, ...coverage].map(id => toDependency(id)), ...setupFiles, ...globalSetup];
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

export const resolveEntryPaths: ResolveEntryPaths<ViteConfigOrFn | VitestWorkspaceConfig> = async (
  localConfig,
  options
) => {
  const inputs = new Set<Input>();
  inputs.add(toEntry(join(options.cwd, 'src/vite-env.d.ts')));
  const configs = await getConfigs(localConfig);
  for (const cfg of configs) {
    const dir = join(options.configFileDir, cfg.test?.root ?? '.');
    if (cfg.test?.include) {
      for (const dependency of cfg.test.include) dependency[0] !== '!' && inputs.add(toEntry(join(dir, dependency)));
    } else {
      for (const dependency of options.config.entry ?? entry) inputs.add(toEntry(join(dir, dependency)));
    }
  }
  return Array.from(inputs);
};

export const resolveConfig: ResolveConfig<ViteConfigOrFn | VitestWorkspaceConfig> = async (localConfig, options) => {
  const inputs = new Set<Input>();
  const configs = await getConfigs(localConfig);
  for (const cfg of configs) {
    for (const dependency of findConfigDependencies(cfg, options)) inputs.add(dependency);
    const entry = cfg.build?.lib?.entry ?? [];
    const dir = join(options.configFileDir, cfg.test?.root ?? '.');
    const deps = (typeof entry === 'string' ? [entry] : Object.values(entry))
      .map(specifier => join(dir, specifier))
      .map(toEntry);
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
  resolveEntryPaths,
  resolveConfig,
  args,
} satisfies Plugin;
