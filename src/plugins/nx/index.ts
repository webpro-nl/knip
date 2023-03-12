import { compact } from '../../util/array.js';
import { _getReferencesFromScripts } from '../../util/binaries/index.js';
import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { NxProjectConfiguration } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

export const NAME = 'Nx';

/** @public */
export const ENABLERS = [/^@nrwl\//];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['{apps,libs}/**/project.json'];

const findNxDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest }) => {
  const config: NxProjectConfiguration = await _load(configFilePath);
  if (!config) return [];
  const targets = config.targets ? Object.values(config.targets) : [];

  const executors = compact(
    targets
      .map(target => target?.executor)
      .filter(executor => executor && !executor.startsWith('.'))
      .map(executor => executor?.split(':')[0])
  );

  const scripts = compact(
    targets
      .filter(target => target.executor === 'nx:run-commands')
      .flatMap(target => (target.options?.commands ?? target.options?.command ? [target.options.command] : []))
  );

  const { binaries, entryFiles } = _getReferencesFromScripts(scripts, { cwd, manifest, knownGlobalsOnly: true });

  return [...executors, ...binaries, ...entryFiles];
};

export const findDependencies = timerify(findNxDependencies);
