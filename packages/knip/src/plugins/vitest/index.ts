import { compact } from '../../util/array.js';
import { dirname, isAbsolute, join, relative } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load, tryResolve } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import { getEnvPackageName, getExternalReporters } from './helpers.js';
import type { ViteConfigOrFn, VitestWorkspaceConfig, ViteConfig, MODE, COMMAND } from './types.js';
import type { PackageJsonWithPlugins } from '../../types/package-json.js';
import type {
  IsPluginEnabledCallback,
  GenericPluginCallback,
  GenericPluginCallbackOptions,
} from '../../types/plugins.js';

// https://vitest.dev/config/

export const NAME = 'Vitest';

/** @public */
export const ENABLERS = ['vitest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  'vitest*.config.{js,mjs,ts,cjs,mts,cts}',
  'vitest.{workspace,projects}.{ts,js,json}',
];

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/*.{test,spec}.?(c|m)[jt]s?(x)'];

// TODO: Promote to something more generic, other plugins may like it too
const resolveEntry = (containingFilePath: string, specifier: string) => {
  const dir = dirname(containingFilePath);
  const resolvedPath = isAbsolute(specifier) ? specifier : tryResolve(join(dir, specifier), containingFilePath);
  if (resolvedPath) return toEntryPattern(relative(dir, resolvedPath));
  return specifier;
};

const enablesCoverageInScript = /vitest(.+)--coverage(?:\.enabled(?:=true)?)?/;

const hasScriptWithCoverage = (scripts: Exclude<PackageJsonWithPlugins['scripts'], undefined>) => {
  return Object.values(scripts).some(script => {
    return enablesCoverageInScript.test(script);
  });
};

const findConfigDependencies = (
  configFilePath: string,
  localConfig: ViteConfig,
  options: GenericPluginCallbackOptions
) => {
  const { isProduction, config, manifest } = options;
  const testConfig = localConfig.test;

  const entryPatterns = (config?.entry ?? testConfig?.include ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);

  if (!testConfig || isProduction) return entryPatterns;

  const environments = testConfig.environment ? [getEnvPackageName(testConfig.environment)] : [];
  const reporters = getExternalReporters(testConfig.reporters);

  const hasCoverageEnabled =
    (testConfig.coverage && testConfig.coverage.enabled !== false) ||
    (manifest.scripts !== undefined && hasScriptWithCoverage(manifest.scripts));
  const coverage = hasCoverageEnabled ? [`@vitest/coverage-${testConfig.coverage?.provider ?? 'v8'}`] : [];

  const setupFiles = [testConfig.setupFiles ?? []].flat().map(v => resolveEntry(configFilePath, v));
  const globalSetup = [testConfig.globalSetup ?? []].flat().map(v => resolveEntry(configFilePath, v));
  return [...entryPatterns, ...environments, ...reporters, ...coverage, ...setupFiles, ...globalSetup];
};

export const findVitestDependencies = async (
  configFilePath: string,
  localConfig: ViteConfigOrFn,
  options: GenericPluginCallbackOptions
) => {
  if (!localConfig) return [];

  if (typeof localConfig === 'function') {
    const dependencies = new Set<string>();
    for (const command of ['dev', 'serve', 'build'] as COMMAND[]) {
      for (const mode of ['development', 'production'] as MODE[]) {
        const config = await localConfig({ command, mode, ssrBuild: undefined });
        findConfigDependencies(configFilePath, config, options).forEach(dependency => dependencies.add(dependency));
      }
    }
    return Array.from(dependencies);
  }

  const entry = localConfig.build?.lib?.entry ?? [];
  const dependencies = (typeof entry === 'string' ? [entry] : Object.values(entry)).map(specifier =>
    resolveEntry(configFilePath, specifier)
  );

  if (!localConfig.test) return dependencies;

  return [...dependencies, ...findConfigDependencies(configFilePath, localConfig, options)];
};

const findVitestWorkspaceDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const localConfig: ViteConfigOrFn | VitestWorkspaceConfig | undefined = await load(configFilePath);

  const dependencies = new Set<string>();
  for (const config of [localConfig].flat()) {
    if (config && typeof config !== 'string') {
      (await findVitestDependencies(configFilePath, config, options)).forEach(dependency =>
        dependencies.add(dependency)
      );
    }
  }
  return compact(dependencies);
};

export const findDependencies = timerify(findVitestWorkspaceDependencies);
