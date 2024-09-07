import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';

// https://vike.dev

const title = 'Vike';

const enablers: EnablerPatterns = ['vike'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const patterns = ['{pages,renderer}/**/+*.{js,jsx,ts,tsx,vue,react,solid}'];

const production = [...patterns, ...patterns.map(pattern => `*/${pattern}`)];

export default {
  title,
  enablers,
  isEnabled,
  production,
} satisfies Plugin;
