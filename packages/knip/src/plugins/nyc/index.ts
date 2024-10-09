import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { toDeferResolve } from '../../util/protocols.js';
import type { NycConfig } from './types.js';

// https://www.npmjs.com/package/nyc

const title = 'nyc';

const enablers = ['nyc'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.nycrc', '.nycrc.json', '.nycrc.{yml,yaml}', 'nyc.config.js', 'package.json'];

const resolveConfig: ResolveConfig<NycConfig> = config => {
  const extend = config?.extends ? [config?.extends].flat() : [];
  const requires = config?.require ? [config?.require].flat() : [];
  return [...extend, ...requires].flat().map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
