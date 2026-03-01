import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toCosmiconfig } from '../../util/plugin-config.ts';
import type { NpmPkgJsonLintConfig } from './types.ts';

// https://npmpackagejsonlint.org/docs/

const title = 'npm-package-json-lint';

const enablers = ['npm-package-json-lint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'npmpackagejsonlint';

const config = ['package.json', ...toCosmiconfig('npmpackagejsonlint')];

const resolveConfig: ResolveConfig<NpmPkgJsonLintConfig> = localConfig => {
  return localConfig?.extends ? [localConfig.extends].map(id => toDependency(id)) : [];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;
