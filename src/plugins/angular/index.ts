import { join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { findTypeScriptDependencies } from '../typescript/index.js';
import type { AngularCLIWorkspaceConfiguration } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// link to docs

export const NAME = 'Angular';

/** @public */
export const ENABLERS = ['@angular/cli'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['angular.json'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, opts) => {
  const { cwd } = opts;
  const config: AngularCLIWorkspaceConfiguration = await load(configFilePath);
  if (!config.projects) return [];

  const dependencies = new Set<string>();

  for (const project of Object.values(config.projects)) {
    if (!project.architect) return [];
    for (const target of Object.values(project.architect)) {
      const { options } = target;
      const [packageName] = typeof target.builder === 'string' ? target.builder.split(':') : [];
      if (typeof packageName === 'string') dependencies.add(packageName);
      if (options) {
        if ('main' in options && typeof options?.main === 'string') {
          dependencies.add(join(cwd, options.main));
        }
        if ('tsConfig' in options && typeof options.tsConfig === 'string') {
          const tsConfigDependencies = await findTypeScriptDependencies(join(cwd, options.tsConfig), opts);
          tsConfigDependencies.forEach(dependency => dependencies.add(dependency));
        }
      }
    }
  }

  return Array.from(dependencies);
};

export const findDependencies = timerify(findPluginDependencies);
