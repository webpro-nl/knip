import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://vercel.com/docs/project-configuration

const title = 'Vercel';

const enablers = ['@vercel/config'];

const entry = ['vercel.{js,mjs,cjs,ts,mts}'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
