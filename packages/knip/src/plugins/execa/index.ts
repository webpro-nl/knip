import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import execaVisitor from './visitors/execa.ts';

// https://github.com/sindresorhus/execa

const title = 'execa';

const enablers = ['execa'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerVisitors: RegisterVisitors = ({ registerVisitors }) => {
  registerVisitors({ script: [execaVisitor] });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
