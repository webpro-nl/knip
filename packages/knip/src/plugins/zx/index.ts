import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import zxVisitor from './visitors/zx.js';

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
