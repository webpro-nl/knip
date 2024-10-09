import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://vike.dev

const title = 'Vike';

const enablers = ['vike'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const patterns = ['{pages,renderer}/**/+*.{js,jsx,ts,tsx,vue,react,solid}'];

const production = [...patterns, ...patterns.map(pattern => `*/${pattern}`)];

export default {
  title,
  enablers,
  isEnabled,
  production,
} satisfies Plugin;
