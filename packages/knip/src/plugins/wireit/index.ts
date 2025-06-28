import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import type { WireitConfig } from './types.js';

// https://github.com/google/wireit

const title = 'Wireit';

const enablers = ['wireit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const resolveConfig: ResolveConfig<WireitConfig> = (localConfig, options) => {
  const scripts = Object.values(localConfig).flatMap(({ command: script }) => (script ? [script] : []));

  const scriptDependencies = options.getInputsFromScripts(scripts);

  return scriptDependencies;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
