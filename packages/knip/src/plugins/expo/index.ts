import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toConfig, toIgnore } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getDependencies } from './helpers.ts';

// https://docs.expo.dev/
// https://github.com/expo/expo/blob/5aea02a6526aa2145832831598583c6788a3448c/packages/%40expo/config/src/Config.ts#L268-L276

const title = 'Expo';

const enablers = ['expo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

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
