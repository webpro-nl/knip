import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://docs.temporal.io/develop/typescript/core-application

const title = 'Temporal.io';

const enablers = ['@temporalio/worker'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const production = ['src/workflows{,/index}.{js,cjs,mjs,ts,cts,mts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  production,
};

export default plugin;
