import { _getDependenciesFromScripts } from '../../binaries/index.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/avajs/ava/blob/main/docs/06-configuration.md

export const NAME = 'Ava';

/** @public */
export const ENABLERS = ['ava'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['ava.config.{js,cjs,mjs}', 'package.json'];

/** @public */
export const ENTRY_FILE_PATTERNS = [
  `test.{js,cjs,mjs}`,
  `{src,source}/test.{js,cjs,mjs}`,
  `**/__tests__/**/*.{js,cjs,mjs}`,
  `**/*.spec.{js,cjs,mjs}`,
  `**/*.test.{js,cjs,mjs}`,
  `**/test-*.{js,cjs,mjs}`,
  `**/test/**/*.{js,cjs,mjs}`,
  `**/tests/**/*.{js,cjs,mjs}`,
  '!**/__tests__/**/__{helper,fixture}?(s)__/**/*',
  '!**/test?(s)/**/{helper,fixture}?(s)/**/*',
];

const findAvaDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, isProduction }) => {
  const config: PluginConfig = configFilePath.endsWith('package.json') ? manifest.ava : await load(configFilePath);

  const entryPatterns = (config?.files ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);
  if (isProduction) return entryPatterns;

  if (!config) return [];

  const requireArgs = (config.require ?? []).map(require => `--require ${require}`);
  const otherArgs = config.nodeArguments ?? [];

  const cmd = `node ${otherArgs.join(' ')} ${requireArgs.join(' ')}`;

  const dependencies = _getDependenciesFromScripts([cmd], {
    cwd,
    manifest,
    knownGlobalsOnly: true,
  });

  return [...entryPatterns, ...dependencies];
};

export const findDependencies = timerify(findAvaDependencies);
