import { hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { NpmPkgJsonLintConfig } from './types.js';

// https://npmpackagejsonlint.org/docs/

const title = 'npm-package-json-lint';

const enablers = ['npm-package-json-lint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'npmpackagejsonlint';

const config = ['.npmpackagejsonlintrc.json', 'npmpackagejsonlint.config.js', 'package.json'];

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
} as const;
