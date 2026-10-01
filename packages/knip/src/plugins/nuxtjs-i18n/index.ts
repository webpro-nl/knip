import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://i18n.nuxtjs.org

const title = '@nuxtjs/i18n';

const enablers = ['@nuxtjs/i18n'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['i18n.config.{js,mjs,ts}', 'i18n/i18n.config.{js,mjs,ts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
