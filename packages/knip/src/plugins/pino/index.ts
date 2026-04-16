import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createPinoTransportVisitor } from './visitors/transportCall.ts';

// https://getpino.io/#/docs/transports

const title = 'pino';

const enablers = ['pino'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createPinoTransportVisitor(ctx));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
