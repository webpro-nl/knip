import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/svg/svgo
// https://github.com/svg/svgo/blob/main/lib/svgo-node.js

const title = 'SVGO';

const enablers = ['svgo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['svgo.config.{js,cjs,mjs}'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} satisfies Plugin;
