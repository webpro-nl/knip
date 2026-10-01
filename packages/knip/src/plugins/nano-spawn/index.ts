import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createNanoSpawnVisitor } from './visitors/nano-spawn.ts';

// https://github.com/sindresorhus/nano-spawn

const title = 'nano-spawn';

const enablers = ['nano-spawn'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createNanoSpawnVisitor(ctx));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
