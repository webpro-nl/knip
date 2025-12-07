import type { ParsedArgs } from 'minimist';
import { DEFAULT_EXTENSIONS } from '../../constants.js';
import type { Args } from '../../types/args.js';
import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { _glob } from '../../util/glob.js';
import { type Input, toAlias, toConfig, toDeferResolve, toDependency, toEntry } from '../../util/input.js';
import { isAbsolute, isInternal, join, toPosix } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getEnvSpecifier, getExternalReporters } from './helpers.js';
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
  scripts ? Object.values(scripts).some(script => isVitestCoverageCommand.test(script)) : false;

const findConfigDependencies = (localConfig: ViteConfig, options: PluginOptions) => {
  const { manifest, configFileDir: dir } = options;
  const testConfig = localConfig.test;

  if (!testConfig) return [];

  const env = testConfig.environment;
  const environments =
    env && env !== 'node'
      ? isInternal(env) || isAbsolute(env)
        ? [toDeferResolve(env)]
        : [toDependency(getEnvSpecifier(env))]
      : [];
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

  const projectsDependencies: Input[] = [];
  if (testConfig.projects !== undefined) {
    for (const projectConfig of testConfig.projects) {
      if (typeof projectConfig !== 'string') {
        projectsDependencies.push(...findConfigDependencies(projectConfig, options));
      }
    }
  }

  return [
    ...environments,
    ...reporters.map(id => toDependency(id)),
    ...coverage.map(id => toDependency(id)),
    ...setupFiles,
    ...globalSetup,
    ...workspaceDependencies,
    ...projectsDependencies,
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
            if (cfg.test?.projects) {
              for (const project of cfg.test.projects) {
                if (typeof project !== 'string') {
                  configs.push(project);
                }
              }
            }
          }
        }
      } else {
        configs.push(config);
        if (config.test?.projects) {
          for (const project of config.test.projects) {
            if (typeof project !== 'string') {
              configs.push(project);
            }
          }
        }
      }
    }
  }
  return configs;
};

export const resolveConfig: ResolveConfig<ViteConfigOrFn | VitestWorkspaceConfig> = async (localConfig, options) => {
  const inputs = new Set<Input>();

  inputs.add(toEntry(join(options.cwd, 'src/vite-env.d.ts')));

  const configs = await getConfigs(localConfig);

  for (const cfg of configs) {
    if (cfg.test?.projects) {
      for (const project of cfg.test.projects) {
        if (typeof project === 'string') {
          const projectFiles = await _glob({
            cwd: options.cwd,
            patterns: [project],
            gitignore: false,
          });
          for (const projectFile of projectFiles) {
            inputs.add(toConfig('vitest', projectFile, { containingFilePath: options.configFilePath }));
          }
        }
      }
    }
  }

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
    if (cfg.resolve?.extensions) {
      // Filter out default extensions from resolve.extensions
      const customExtensions = cfg.resolve.extensions.filter(
        ext => ext.startsWith('.') && !DEFAULT_EXTENSIONS.includes(ext)
      );

      for (const ext of customExtensions) {
        inputs.add(toEntry(`src/**/*${ext}`));
      }
    }
    for (const dependency of findConfigDependencies(cfg, options)) inputs.add(dependency);
    const _entry = cfg.build?.lib?.entry ?? [];
    const deps = (typeof _entry === 'string' ? [_entry] : Object.values(_entry))
      .map(specifier => join(dir, specifier))
      .map(id => toEntry(id));
    for (const dependency of deps) inputs.add(dependency);
  }

  return Array.from(inputs);
};

const args: Args = {
  config: true,
  resolveInputs: (parsed: ParsedArgs) => {
    const inputs: Input[] = [];
    if (parsed['ui']) inputs.push(toDependency('@vitest/ui', { optional: true }));
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  args,
};

export default plugin;
