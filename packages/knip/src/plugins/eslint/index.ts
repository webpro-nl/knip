import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { getInputs } from './helpers.js';
import type { ESLintConfigDeprecated } from './types.js';

// New: https://eslint.org/docs/latest/use/configure/configuration-files
// Old: https://eslint.org/docs/latest/use/configure/configuration-files-deprecated

// Note: shareable configs should use `peerDependencies` for plugins
// https://eslint.org/docs/latest/extend/shareable-configs#publishing-a-shareable-config

const title = 'ESLint';

const enablers = ['eslint', '@eslint/js'];

const isEnabled: IsPluginEnabled = ({ dependencies, manifest, config }) =>
  hasDependency(dependencies, enablers) ||
  'eslint' in config ||
  Boolean(manifest.name && /(^eslint-config|\/eslint-config)/.test(manifest.name));

const packageJsonPath = 'eslintConfig';

const config = [
  'eslint.config.{js,cjs,mjs,ts,mts,cts}',
  '.eslintrc',
  '.eslintrc.{js,json,cjs}',
  '.eslintrc.{yml,yaml}',
  'package.json',
];

const resolveConfig: ResolveConfig<ESLintConfigDeprecated> = (localConfig, options) => getInputs(localConfig, options);

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
