import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/sverweij/dependency-cruiser

const title = 'dependency-cruiser';

const enablers = ['dependency-cruiser'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.dependency-cruiser.{js,cjs,mjs,json}'];

const args = {
  binaries: ['depcruise', 'dependency-cruise', 'dependency-cruiser', 'depcruise-baseline'],
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
};

export default plugin;
