import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';

// https://hardhat.org/docs

const title = 'Hardhat';

const enablers = ['hardhat'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry: string[] = ['hardhat.config.{js,cjs,mjs,ts}'];

const resolve: Resolve = async () => {
  return [toDependency('hardhat')];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  resolve,
};

export default plugin;
