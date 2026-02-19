import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import zxVisitor from './visitors/zx.ts';

// https://google.github.io/zx/

const title = 'zx';

const enablers = ['zx'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerVisitors: RegisterVisitors = ({ registerVisitors }) => {
  registerVisitors({ script: [zxVisitor] });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
