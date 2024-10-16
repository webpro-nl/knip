import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Dependency, toConfig, toDependency, toProductionEntry } from '../../util/dependencies.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { AngularCLIWorkspaceConfiguration } from './types.js';

// https://angular.io/guide/workspace-config

const title = 'Angular';

const enablers = ['@angular/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['angular.json'];

const production: string[] = [];

const resolveConfig: ResolveConfig<AngularCLIWorkspaceConfiguration> = async (config, options) => {
  const { cwd } = options;

  if (!config?.projects) return [];

  const dependencies = new Set<Dependency>();

  for (const project of Object.values(config.projects)) {
    if (!project.architect) return [];
    for (const target of Object.values(project.architect)) {
      const { options: opts } = target;
      const [packageName] = typeof target.builder === 'string' ? target.builder.split(':') : [];
      if (typeof packageName === 'string') dependencies.add(toDependency(packageName));
      if (opts) {
        if ('main' in opts && typeof opts.main === 'string') {
          dependencies.add(toProductionEntry(join(cwd, opts.main)));
        }
        if ('browser' in opts && typeof opts.browser === 'string') {
          dependencies.add(toProductionEntry(join(cwd, opts.browser)));
        }
        if ('ssr' in opts && opts.ssr && typeof opts.ssr === 'object') {
          if ('entry' in opts.ssr && typeof opts.ssr.entry === 'string') {
            dependencies.add(toProductionEntry(join(cwd, opts.ssr.entry)));
          }
        }
        if ('tsConfig' in opts && typeof opts.tsConfig === 'string') {
          dependencies.add(toConfig('typescript', opts.tsConfig));
        }
      }
    }
  }

  return Array.from(dependencies);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
} satisfies Plugin;
