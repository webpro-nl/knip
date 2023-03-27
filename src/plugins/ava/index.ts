import { _getReferencesFromScripts } from '../../binaries/index.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/avajs/ava/blob/main/docs/06-configuration.md

export const NAME = 'Ava';

/** @public */
export const ENABLERS = ['ava'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['ava.config.{js,cjs,mjs}', 'package.json'];

const findAvaDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, workspaceConfig }) => {
  const config: PluginConfig = configFilePath.endsWith('package.json') ? manifest.ava : await load(configFilePath);

  const requireArgs = (config?.require ?? []).map(require => `--require ${require}`);
  const otherArgs = config?.nodeArguments ?? [];

  const cmd = `node ${otherArgs.join(' ') + ' '}${requireArgs.join(' ')}`;
  const { binaries } = _getReferencesFromScripts([cmd], {
    cwd,
    manifest,
    ignore: workspaceConfig.ignoreBinaries,
    knownGlobalsOnly: true,
  });

  return binaries;
};

export const findDependencies = timerify(findAvaDependencies);
