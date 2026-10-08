import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toConfig, toIgnore } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getDependencies } from './helpers.ts';

// https://docs.expo.dev/

const title = 'Expo';

const enablers = ['expo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

// https://docs.expo.dev/workflow/configuration/#configuration-resolution-rules
const config = ['app.json', 'app.config.{json,ts,js,mts,cts,mjs,cjs}'];

// https://docs.expo.dev/versions/latest/config/babel/
const resolve: Resolve = () => [toConfig('babel', 'babel.config'), toIgnore('babel-preset-expo', 'unresolved')];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolve,
  resolveConfig: getDependencies,
};

export default plugin;
