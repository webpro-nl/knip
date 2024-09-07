import type { PackageJson } from '#p/types/package-json.js';
import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig, ResolveEntryPaths } from '#p/types/plugins.js';
import { join } from '#p/util/path.js';
import { hasDependency, resolveEntry } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import { getEnvPackageName, getExternalReporters } from './helpers.js';
import type { COMMAND, MODE, ViteConfig, ViteConfigOrFn, VitestWorkspaceConfig } from './types.js';

// https://vitest.dev/config/

const title = 'Vitest';

const enablers = ['vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vitest*.config.{js,mjs,ts,cjs,mts,cts}', 'vitest.{workspace,projects}.{ts,js,json}'];

const entry = ['**/*.{bench,test,test-d,spec}.?(c|m)[jt]s?(x)'];

const isVitestCoverageCommand = /vitest(.+)--coverage(?:\.enabled(?:=true)?)?/;

const hasScriptWithCoverage = (scripts: PackageJson['scripts']) =>
  scripts
    ? Object.values(scripts).some(script => {
        return isVitestCoverageCommand.test(script);
      })
    : false;

const findConfigDependencies = (localConfig: ViteConfig, options: PluginOptions) => {
  const { manifest } = options;
  const testConfig = localConfig.test;

  if (!testConfig) return [];

  const environments =
    testConfig.environment && testConfig.environment !== 'node' ? [getEnvPackageName(testConfig.environment)] : [];
  const reporters = getExternalReporters(testConfig.reporters);

  const hasCoverageEnabled =
    (testConfig.coverage && testConfig.coverage.enabled !== false) || hasScriptWithCoverage(manifest.scripts);
  const coverage = hasCoverageEnabled ? [`@vitest/coverage-${testConfig.coverage?.provider ?? 'v8'}`] : [];

  const rootDir = testConfig.root ?? '.';
  const setupFiles = [testConfig.setupFiles ?? []].flat().map(specifier => resolveEntry(options, specifier, rootDir));
  const globalSetup = [testConfig.globalSetup ?? []].flat().map(specifier => resolveEntry(options, specifier, rootDir));

  return [...environments, ...reporters, ...coverage, ...setupFiles, ...globalSetup];
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
  const dependencies = new Set<string>(['src/vite-env.d.ts']);
  const configs = await getConfigs(localConfig);
  for (const cfg of configs) {
    const rootDir = cfg.test?.root ?? '.';
    if (cfg.test?.include) {
      for (const dependency of cfg.test.include) dependencies.add(join(rootDir, dependency));
    } else {
      for (const dependency of options.config.entry ?? entry) dependencies.add(join(rootDir, dependency));
    }
  }

  return Array.from(dependencies).map(toEntryPattern);
};

export const resolveConfig: ResolveConfig<ViteConfigOrFn | VitestWorkspaceConfig> = async (localConfig, options) => {
  const dependencies = new Set<string>();
  const configs = await getConfigs(localConfig);
  for (const cfg of configs) {
    for (const dependency of findConfigDependencies(cfg, options)) dependencies.add(dependency);
    const entry = cfg.build?.lib?.entry ?? [];
    const rootDir = cfg.test?.root ?? '.';
    const deps = (typeof entry === 'string' ? [entry] : Object.values(entry)).map(specifier =>
      resolveEntry(options, specifier, rootDir)
    );
    for (const dependency of deps) dependencies.add(dependency);
  }
  return Array.from(dependencies);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;
