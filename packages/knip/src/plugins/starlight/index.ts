import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { config } from '../astro/index.ts';
import { resolveFromAST } from './resolveFromAST.ts';

// https://starlight.astro.build/reference/configuration/

const title = 'Starlight';

const enablers = ['@astrojs/starlight'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
