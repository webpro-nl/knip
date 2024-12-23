import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toConfig, toDependency, toEntry, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import * as karma from '../karma/helpers.js';
import type {
  AngularCLIWorkspaceConfiguration,
  KarmaTarget,
  Project,
  WebpackBrowserSchemaForBuildFacade,
} from './types.js';

// https://angular.io/guide/workspace-config

const title = 'Angular';

const enablers = ['@angular/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['angular.json'];

const resolveConfig: ResolveConfig<AngularCLIWorkspaceConfiguration> = async (config, options) => {
  const { cwd, configFilePath } = options;

  if (!config?.projects) return [];

  const inputs = new Set<Input>();

  for (const project of Object.values(config.projects)) {
    if (!project.architect) return [];
    for (const [targetName, target] of Object.entries(project.architect)) {
      const { options: opts, configurations: configs } = target;
      const [packageName] = typeof target.builder === 'string' ? target.builder.split(':') : [];
      if (typeof packageName === 'string') inputs.add(toDependency(packageName));
      if (opts) {
        if ('tsConfig' in opts && typeof opts.tsConfig === 'string') {
          inputs.add(toConfig('typescript', opts.tsConfig, configFilePath));
        }
      }
      const defaultEntriesByOption: EntriesByOption = opts ? entriesByOption(opts) : new Map();
      const entriesByOptionByConfig: Map<string, EntriesByOption> = new Map(
        configs ? Object.entries(configs).map(([name, opts]) => [name, entriesByOption(opts)]) : []
      );
      const productionEntriesByOption: EntriesByOption =
        entriesByOptionByConfig.get(PRODUCTION_CONFIG_NAME) ?? new Map();
      const normalizePath = (path: string) => join(cwd, path);
      for (const [configName, entriesByOption] of entriesByOptionByConfig.entries()) {
        for (const entries of entriesByOption.values()) {
          for (const entry of entries) {
            inputs.add(
              targetName === BUILD_TARGET_NAME && configName === PRODUCTION_CONFIG_NAME
                ? toProductionEntry(normalizePath(entry))
                : toEntry(normalizePath(entry))
            );
          }
        }
      }
      for (const [option, entries] of defaultEntriesByOption.entries()) {
        for (const entry of entries) {
          inputs.add(
            targetName === BUILD_TARGET_NAME && !productionEntriesByOption.get(option)?.length
              ? toProductionEntry(normalizePath(entry))
              : toEntry(normalizePath(entry))
          );
        }
      }
      if (target.builder === '@angular-devkit/build-angular:karma' && opts) {
        const karmaBuilderOptions = opts as KarmaTarget;
        // https://github.com/angular/angular-cli/blob/19.0.6/packages/angular_devkit/build_angular/src/builders/karma/schema.json#L143
        const testFilePatterns = karmaBuilderOptions.include ?? ['**/*.spec.ts'];
        for (const testFilePattern of testFilePatterns) {
          inputs.add(toEntry(testFilePattern));
        }
        // https://github.com/angular/angular-cli/blob/19.0.6/packages/angular_devkit/build_angular/src/builders/karma/schema.json#L146
        const excludedTestFilePatterns = karmaBuilderOptions.exclude ?? [];
        for (const excludedTestFilePattern of excludedTestFilePatterns) {
          inputs.add(toEntry(`!${excludedTestFilePattern}`));
        }
        const karmaConfig = karmaBuilderOptions.karmaConfig;
        if (!karmaConfig) {
          // Hardcoded default Karma config from Angular builder
          // https://github.com/angular/angular-cli/blob/19.0.6/packages/angular_devkit/build_angular/src/builders/karma/index.ts#L115
          karma
            .inputsFromPlugins(
              ['karma-jasmine', 'karma-chrome-launcher', 'karma-jasmine-html-reporter', 'karma-coverage'],
              options.manifest.devDependencies
            )
            .forEach(inputs.add, inputs);
          karma.inputsFromFrameworks(['jasmine']).forEach(inputs.add, inputs);
        }
        if (karmaConfig && !karma.configFiles.includes(karmaConfig)) {
          inputs.add(toConfig('karma', karmaConfig, options.configFilePath));
        }
      }
    }
  }

  return Array.from(inputs);
};

const entriesByOption = (opts: TargetOptions): EntriesByOption =>
  new Map(
    Object.entries({
      main: 'main' in opts && opts.main && typeof opts.main === 'string' ? [opts.main] : [],
      scripts:
        'scripts' in opts && opts.scripts && Array.isArray(opts.scripts)
          ? (opts.scripts as ScriptsBuildOption).map(scriptStringOrObject =>
              typeof scriptStringOrObject === 'string' ? scriptStringOrObject : scriptStringOrObject.input
            )
          : [],
      fileReplacements:
        'fileReplacements' in opts && opts.fileReplacements && Array.isArray(opts.fileReplacements)
          ? (opts.fileReplacements as FileReplacementsBuildOption).map(fileReplacement =>
              'with' in fileReplacement ? fileReplacement.with : fileReplacement.replaceWith
            )
          : [],
      browser: 'browser' in opts && opts.browser && typeof opts.browser === 'string' ? [opts.browser] : [],
      server: 'server' in opts && opts.server && typeof opts.server === 'string' ? [opts.server] : [],
      ssrEntry:
        'ssr' in opts &&
        opts.ssr &&
        typeof opts.ssr === 'object' &&
        'entry' in opts.ssr &&
        typeof opts.ssr.entry === 'string'
          ? [opts.ssr.entry]
          : [],
    })
  );

type TargetOptions = Exclude<Target['options'], undefined>;
type Target = Architect[string];
type Architect = Exclude<Project['architect'], undefined>;

type EntriesByOption = Map<string, readonly string[]>;

//👇 Using Webpack-based browser schema to support old `replaceWith` file replacements
type FileReplacementsBuildOption = Exclude<WebpackBrowserSchemaForBuildFacade['fileReplacements'], undefined>;
type ScriptsBuildOption = Exclude<WebpackBrowserSchemaForBuildFacade['scripts'], undefined>;

const PRODUCTION_CONFIG_NAME = 'production';
const BUILD_TARGET_NAME = 'build';

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
