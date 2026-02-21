import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import transportCall from './visitors/transportCall.js';

// https://getpino.io/#/docs/transports

const title = 'pino';

const enablers = ['pino'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerVisitors: RegisterVisitors = ({ registerVisitors }) => {
  registerVisitors({ dynamicImport: [transportCall] });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
