import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { _glob } from '../../util/glob.js';
import { toDeferResolve, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PrairieLearnConfig } from './types.js';

// https://prairielearn.readthedocs.io/en/latest/instructor-guide/

const title = 'prairielearn';

const enablers = 'This plugin is enabled when an infoCourse.json file is found.';

const isEnabled: IsPluginEnabled = async ({ cwd }) => {
  const files = await _glob({ cwd, patterns: ['**/infoCourse.json'] });
  return files.length > 0;
};

const config: string[] = ['**/info.json'];

const entry: string[] = [];

const production: string[] = [];

const resolveConfig: ResolveConfig<PrairieLearnConfig> = async config => {
  const inputs = [
    ...(config.dependencies?.nodeModulesStyles ?? []),
    ...(config.dependencies?.nodeModulesScripts ?? []),
    ...(Object.values(config.dynamicDependencies?.nodeModulesScripts ?? {})),
  ];
  const packages = inputs.map(script => {
    const packageName = script.split('/')[0];
    return packageName;
  });
  console.log(packages);
  return packages.map(id => toDependency(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveConfig,
} satisfies Plugin;
