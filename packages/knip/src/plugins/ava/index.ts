import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { AvaConfig } from './types.js';

// https://github.com/avajs/ava/blob/main/docs/06-configuration.md

const title = 'Ava';

const enablers = ['ava'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['ava.config.{js,cjs,mjs}', 'package.json'];

const entry = [
  'test.{js,cjs,mjs,ts}',
  '{src,source}/test.{js,cjs,mjs,ts}',
  '**/__tests__/**/*.{js,cjs,mjs,ts}',
  '**/*.spec.{js,cjs,mjs,ts}',
  '**/*.test.{js,cjs,mjs,ts}',
  '**/test-*.{js,cjs,mjs,ts}',
  '**/test/**/*.{js,cjs,mjs,ts}',
  '**/tests/**/*.{js,cjs,mjs,ts}',
  '!**/__tests__/**/__{helper,fixture}?(s)__/**/*',
  '!**/test?(s)/**/{helper,fixture}?(s)/**/*',
];

const resolveEntryPaths: ResolveEntryPaths<AvaConfig> = localConfig => {
  if (typeof localConfig === 'function') localConfig = localConfig();
  return (localConfig?.files ?? []).map(toEntry);
};

const resolveConfig: ResolveConfig<AvaConfig> = async (localConfig, options) => {
  if (typeof localConfig === 'function') localConfig = localConfig();

  const nodeArgs = localConfig.nodeArguments ?? [];
  const requireArgs = (localConfig.require ?? []).map(require => `--require ${require}`);
  const fakeCommand = `node ${nodeArgs.join(' ')} ${requireArgs.join(' ')}`;

  return options.getInputsFromScripts(fakeCommand, { knownBinsOnly: true });
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;
