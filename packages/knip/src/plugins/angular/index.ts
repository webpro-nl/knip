import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toConfig, toDependency, toEntry, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { AngularCLIWorkspaceConfiguration, WebpackBrowserSchemaForBuildFacade } from './types.js';

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
    for (const target of Object.values(project.architect)) {
      const { options: opts, configurations: configs } = target;
      const [packageName] = typeof target.builder === 'string' ? target.builder.split(':') : [];
      if (typeof packageName === 'string') inputs.add(toDependency(packageName));
      if (opts) {
        if ('main' in opts && typeof opts.main === 'string') {
          inputs.add(toProductionEntry(join(cwd, opts.main)));
        }
        if ('browser' in opts && typeof opts.browser === 'string') {
          inputs.add(toProductionEntry(join(cwd, opts.browser)));
        }
        if ('ssr' in opts && opts.ssr && typeof opts.ssr === 'object') {
          if ('entry' in opts.ssr && typeof opts.ssr.entry === 'string') {
            inputs.add(toProductionEntry(join(cwd, opts.ssr.entry)));
          }
        }
        if ('tsConfig' in opts && typeof opts.tsConfig === 'string') {
          inputs.add(toConfig('typescript', opts.tsConfig, configFilePath));
        }
        if ('server' in opts && opts.server && typeof opts.server === 'string') {
          inputs.add(toProductionEntry(join(cwd, opts.server)));
        }
        if ('fileReplacements' in opts && opts.fileReplacements && Array.isArray(opts.fileReplacements)) {
          for (const fileReplacedBy of filesReplacedBy(opts.fileReplacements)) {
            inputs.add(toEntry(fileReplacedBy));
          }
        }
      }
      if (configs) {
        for (const [configName, config] of Object.entries(configs)) {
          const isProductionConfig = configName === 'production';
          if ('fileReplacements' in config && config.fileReplacements && Array.isArray(config.fileReplacements)) {
            for (const fileReplacedBy of filesReplacedBy(config.fileReplacements)) {
              inputs.add(isProductionConfig ? toProductionEntry(fileReplacedBy) : toEntry(fileReplacedBy));
            }
          }
        }
      }
    }
  }

  return Array.from(inputs);
};

const filesReplacedBy = (
  //👇 Using Webpack-based browser schema to support old `replaceWith` file replacements
  fileReplacements: Exclude<WebpackBrowserSchemaForBuildFacade['fileReplacements'], undefined>
): readonly string[] =>
  fileReplacements.map(fileReplacement =>
    'with' in fileReplacement ? fileReplacement.with : fileReplacement.replaceWith
  );

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
