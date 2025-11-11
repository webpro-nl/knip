import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/i18next/i18next-parser

const title = 'i18next Parser';

const enablers = ['i18next-parser'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['i18next-parser.config.{js,mjs,json,ts,yaml,yml}'];

const args = {
  binaries: ['i18next'],
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
};

export default plugin;
