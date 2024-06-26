import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency, toCosmiconfig } from '#p/util/plugin.js';
import type { NpmPkgJsonLintConfig } from './types.js';

// https://npmpackagejsonlint.org/docs/

const title = 'npm-package-json-lint';

const enablers = ['npm-package-json-lint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'npmpackagejsonlint';

const config = ['package.json', ...toCosmiconfig('npmpackagejsonlint')];

const resolveConfig: ResolveConfig<NpmPkgJsonLintConfig> = localConfig => {
  return localConfig?.extends ? [localConfig.extends] : [];
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
