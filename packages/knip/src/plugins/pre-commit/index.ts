import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/fastify/pre-commit

const title = 'pre-commit';

const packages = ['pre-commit', '@fastify/pre-commit'];

const enablers = packages;

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

const resolve: Resolve = options => {
  const { dependencies, devDependencies } = options.manifest;
  const inputs = [];
  for (const name of packages) if (dependencies?.[name] || devDependencies?.[name]) inputs.push(toDependency(name));
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  resolve,
};

export default plugin;
